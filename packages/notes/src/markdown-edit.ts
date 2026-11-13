import { A, O, pipe, S } from "@mobily/ts-belt";
import { match } from "ts-pattern";

/** A selection in the body: `from` and `to` are offsets, and `from <= to`. */
export interface TextSelection {
	from: number;
	to: number;
}

/** The body and its selection, before a toolbar action. */
export interface EditInput {
	text: string;
	selection: TextSelection;
}

/**
 * One change of the body: the text from `from` to `to` becomes `insert`. `selection` is the
 * selection after the change. The editor applies it as one transaction, so one undo
 * removes it.
 */
export interface TextEdit {
	from: number;
	to: number;
	insert: string;
	selection: TextSelection;
}

/** The actions of the toolbar that change the text. Undo and redo are commands of the editor. */
export const MARKDOWN_EDITS = [
	"heading",
	"bold",
	"italic",
	"strikethrough",
	"code",
	"quote",
	"bullet-list",
	"numbered-list",
	"link",
	"code-block",
	"table",
	"rule",
	"callout",
] as const;

export type MarkdownEdit = (typeof MARKDOWN_EDITS)[number];

/**
 * Puts `marker` on the two sides of the selection, or removes it when it is there. An empty
 * selection gets the two markers, with the cursor between them.
 */
function toggleWrap(input: EditInput, marker: string): TextEdit {
	const { text, selection } = input;
	const { from, to } = selection;
	const size = marker.length;
	const before = S.slice(text, from - size, from);
	const after = S.slice(text, to, to + size);
	if (from >= size && before === marker && after === marker)
		return {
			from: from - size,
			to: to + size,
			insert: S.slice(text, from, to),
			selection: { from: from - size, to: to - size },
		};
	return {
		from,
		to,
		insert: `${marker}${S.slice(text, from, to)}${marker}`,
		selection: { from: from + size, to: to + size },
	};
}

/** The start of the first line and the end of the last line of the selection. */
function lineRange(input: EditInput): TextSelection {
	const { text, selection } = input;
	return {
		from: pipe(
			S.slice(text, 0, selection.from),
			S.lastIndexOf("\n"),
			O.mapWithDefault(0, (index) => index + 1),
		),
		to: pipe(
			S.sliceToEnd(text, selection.to),
			S.indexOf("\n"),
			O.mapWithDefault(S.length(text), (index) => selection.to + index),
		),
	};
}

interface LinePrefix {
	/** The prefix of the line at `index`, from 0, for example `1. ` for a numbered list. */
	prefix: (index: number) => string;
	/** A prefix of this kind that a line can have. The new prefix replaces it. */
	pattern: RegExp;
	/** The prefix of the action. When each line has it, the toggle removes it. */
	active?: RegExp;
}

/**
 * Gives each line of the selection the prefix, or removes it when each line has one. The
 * selection moves with the text of its lines.
 */
function toggleLinePrefix(input: EditInput, kind: LinePrefix): TextEdit {
	const range = lineRange(input);
	const lines = S.split(S.slice(input.text, range.from, range.to), "\n");
	const active = kind.active ?? kind.pattern;
	const remove = A.every(lines, (line) => active.test(line));
	const changed = A.mapWithIndex(lines, (index, line) => {
		const bare = S.replaceByRe(line, kind.pattern, "");
		return remove ? bare : `${kind.prefix(index)}${bare}`;
	});
	const insert = A.join(changed, "\n");
	const firstDelta =
		S.length(A.getUnsafe(changed, 0)) - S.length(A.getUnsafe(lines, 0));
	const lastDelta = S.length(insert) - (range.to - range.from);
	return {
		from: range.from,
		to: range.to,
		insert,
		selection: {
			from: Math.max(range.from, input.selection.from + firstDelta),
			to: Math.max(range.from, input.selection.to + lastDelta),
		},
	};
}

/**
 * Puts a block on its own lines around the selection: `open`, the selected lines, and
 * `close`. With no selection, `placeholder` is the text of the block, and it is selected.
 */
function wrapBlock(
	input: EditInput,
	block: { open: string; close: string; placeholder: string },
): TextEdit {
	const range = lineRange(input);
	const inner = S.slice(input.text, range.from, range.to);
	const body = S.isEmpty(inner) ? block.placeholder : inner;
	const start = range.from + S.length(block.open) + 1;
	return {
		from: range.from,
		to: range.to,
		insert: `${block.open}\n${body}\n${block.close}`,
		selection: { from: start, to: start + S.length(body) },
	};
}

/**
 * Puts a new block after the line of the cursor, with an empty line before it. The cursor
 * goes to the end of the block.
 */
function insertBlock(input: EditInput, block: string): TextEdit {
	const end = lineRange(input).to;
	const lineIsEmpty = end === 0 || S.slice(input.text, end - 1, end) === "\n";
	const insert = lineIsEmpty ? `${block}\n` : `\n\n${block}\n`;
	const cursor = end + S.length(insert);
	return {
		from: end,
		to: end,
		insert,
		selection: { from: cursor, to: cursor },
	};
}

/** A link with the selection as its text. The URL placeholder is selected, to type over. */
function link(input: EditInput): TextEdit {
	const { from, to } = input.selection;
	const label = S.slice(input.text, from, to);
	const text = S.isEmpty(label) ? "text" : label;
	const url = "https://";
	const urlStart = from + S.length(text) + 3;
	return {
		from,
		to,
		insert: `[${text}](${url})`,
		selection: { from: urlStart, to: urlStart + S.length(url) },
	};
}

const TABLE = pipe(
	["| Column | Column |", "| ------ | ------ |", "| Text   | Text   |"],
	A.join("\n"),
);

/** The change of the body for one action of the toolbar. */
export function markdownEdit(edit: MarkdownEdit, input: EditInput): TextEdit {
	return match(edit)
		.with("heading", () =>
			toggleLinePrefix(input, {
				prefix: () => "## ",
				pattern: /^#{1,6} /,
				active: /^## /,
			}),
		)
		.with("bold", () => toggleWrap(input, "**"))
		.with("italic", () => toggleWrap(input, "_"))
		.with("strikethrough", () => toggleWrap(input, "~~"))
		.with("code", () => toggleWrap(input, "`"))
		.with("quote", () =>
			toggleLinePrefix(input, { prefix: () => "> ", pattern: /^> ?/ }),
		)
		.with("bullet-list", () =>
			toggleLinePrefix(input, { prefix: () => "- ", pattern: /^[-*+] / }),
		)
		.with("numbered-list", () =>
			toggleLinePrefix(input, {
				prefix: (index) => `${index + 1}. `,
				pattern: /^\d+\. /,
			}),
		)
		.with("link", () => link(input))
		.with("code-block", () =>
			wrapBlock(input, { open: "```", close: "```", placeholder: "code" }),
		)
		.with("table", () => insertBlock(input, TABLE))
		.with("rule", () => insertBlock(input, "---"))
		.with("callout", () =>
			wrapBlock(input, {
				open: '::callout{type="note"}',
				close: "::",
				placeholder: "Text of the callout",
			}),
		)
		.exhaustive();
}
