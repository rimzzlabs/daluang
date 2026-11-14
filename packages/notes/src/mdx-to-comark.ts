import { A, O, pipe, S } from "@mobily/ts-belt";
import { fenceEnd, withoutImports } from "./mdx-imports";
import { type Prop, parseTag, type Tag } from "./mdx-tag";

/** The body in the syntax of Comark, and each component that stays, one name for each use. */
export interface ComarkBody {
	body: string;
	kept: readonly string[];
}

interface Step {
	lines: readonly string[];
	kept: readonly string[];
	next: number;
	block: boolean;
}

interface Source {
	text: string;
	lines: readonly string[];
	starts: readonly number[];
}

/** The closing line of an element, and its height: 1 when it has no child element. */
interface Closer {
	line: number;
	height: number;
}

interface Level {
	source: Source;
	closers: ReadonlyMap<number, Closer>;
	depth: number;
	opened: Map<string, number>;
}

const MAX_DEPTH = 8;
/** A longer tag stays as text. The limit keeps the read of each tag short. */
const MAX_TAG_LINES = 32;
const COMPONENT_START = /^<[A-Z]/;
const CLOSING_TAG = /^<\/([A-Z]\w*)>\s*$/;
/** A tag in text. The third group is `/` for `<Name … />` on one line. It is linear. */
const TAG_IN_TEXT = /<(\/?)([A-Z]\w*)(?:[^<>]*?(\/)>)?/g;
/** Comark reads another character of a name, or of a prop name, in another way. */
const COMARK_NAME = /^[A-Za-z0-9]+$/;
const COMARK_PROP_NAME = /^[A-Za-z_][\w-]*$/;
const WORD_START = /(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/g;
/** JSX decodes an entity. Comark reads a backslash and a line break in another way. */
const UNSAFE_VALUE = /[\\&\r\n]/;

function lineAt(source: Source, index: number): string {
	return source.lines[index] ?? "";
}

function startOf(source: Source, index: number): number {
	return source.starts[index] ?? 0;
}

function isBlank(line: string): boolean {
	return pipe(line, S.trim, S.isEmpty);
}

function toSource(text: string): Source {
	const lines = S.split(text, "\n");
	// A loop: a copy of the array for each line costs too much on a body of 1 MB.
	const starts: number[] = [];
	let offset = 0;
	for (const line of lines) {
		starts.push(offset);
		offset += S.length(line) + 1;
	}
	return { text, lines, starts };
}

function lineOf(source: Source, offset: number): number {
	let low = 0;
	let high = source.starts.length - 1;
	while (low < high) {
		const middle = Math.ceil((low + high) / 2);
		if (startOf(source, middle) <= offset) low = middle;
		else high = middle - 1;
	}
	return low;
}

function readTag(source: Source, index: number): Tag {
	const line = lineAt(source, index);
	const indent = S.length(line) - pipe(line, S.trimStart, S.length);
	const start = startOf(source, index) + indent;
	const last = Math.min(index + MAX_TAG_LINES, source.lines.length) - 1;
	const end = startOf(source, last) + S.length(lineAt(source, last));
	const tag = parseTag(source.text.slice(start, end), 0);
	return { ...tag, end: tag.end + start };
}

function restOfLine(source: Source, tag: Tag): string {
	const line = lineOf(source, tag.end - 1);
	const end = startOf(source, line) + S.length(lineAt(source, line));
	return source.text.slice(tag.end, end);
}

function textLines(lines: readonly string[]): readonly string[] {
	const text: string[] = [];
	let index = 0;
	while (index < lines.length) {
		const fence = fenceEnd(lines, index);
		if (!O.isSome(fence)) text.push(lines[index] ?? "");
		index = O.isSome(fence) ? fence + 1 : index + 1;
	}
	return text;
}

/** The line with each code span removed. A run of backticks closes at a run of its length. */
function withoutCodeSpans(line: string): string {
	let text = "";
	let from = 0;
	let open = 0;
	for (const run of line.matchAll(/`+/g)) {
		if (open === 0) {
			text += line.slice(from, run.index);
			from = run.index;
			open = run[0].length;
		} else if (run[0].length === open) {
			open = 0;
			from = run.index + run[0].length;
		}
	}
	return text + line.slice(from);
}

/** Changes `opened`. A closing tag in kept text adds its name only when no tag opens it. */
function keptNames(
	lines: readonly string[],
	opened: Map<string, number>,
): readonly string[] {
	const names: string[] = [];
	for (const line of textLines(lines))
		for (const found of withoutCodeSpans(line).matchAll(TAG_IN_TEXT)) {
			const name = found[2] ?? "";
			const open = opened.get(name) ?? 0;
			const closing = found[1] === "/";
			if (!closing || open === 0) names.push(name);
			if (closing) opened.set(name, Math.max(0, open - 1));
			else if (found[3] !== "/") opened.set(name, open + 1);
		}
	return names;
}

/** The closer of each element, in one pass with a stack of local objects: it is linear. */
function matchClosers(source: Source): ReadonlyMap<number, Closer> {
	const open: (Closer & { name: string })[] = [];
	const closers = new Map<number, Closer>();
	for (let index = 0; index < source.lines.length; index += 1) {
		const fence = fenceEnd(source.lines, index);
		const trimmed = S.trimStart(lineAt(source, index));
		const closing = CLOSING_TAG.exec(trimmed)?.[1];
		if (O.isSome(fence)) index = fence;
		else if (COMPONENT_START.test(trimmed)) {
			const tag = readTag(source, index);
			if (tag.status === "broken") continue;
			if (!tag.selfClosing && isBlank(restOfLine(source, tag)))
				open.push({ name: tag.name, line: index, height: 1 });
			index = lineOf(source, tag.end - 1);
		} else if (closing !== undefined) {
			// Only the last MAX_DEPTH open elements: a stray closing tag costs a bounded search.
			let at = open.length - 1;
			while (at > open.length - MAX_DEPTH && open[at]?.name !== closing)
				at -= 1;
			const element = open[at];
			if (element?.name !== closing) continue;
			closers.set(element.line, { line: index, height: element.height });
			open.length = at;
			const parent = open[at - 1];
			if (parent) parent.height = Math.max(parent.height, element.height + 1);
		}
	}
	return closers;
}

function dedent(lines: readonly string[]): readonly string[] {
	const indent = pipe(
		lines,
		A.reject(isBlank),
		A.map((line) => S.length(line) - pipe(line, S.trimStart, S.length)),
		A.reduce(Number.POSITIVE_INFINITY, (least, size) => Math.min(least, size)),
	);
	return A.map(lines, (line) => line.slice(indent));
}

/** A child line that Comark reads in another way: a `::` of a block, or an expression. */
function isUnsafeChild(line: string): boolean {
	return (
		pipe(line, S.trimStart, S.startsWith("::")) ||
		pipe(line, withoutCodeSpans, S.includes("{"))
	);
}

function kebabCase(name: string): string {
	return pipe(name, S.replaceByRe(WORD_START, "-"), S.toLowerCase);
}

function fitsComark(prop: Prop): boolean {
	if (!COMARK_PROP_NAME.test(prop.name)) return false;
	return prop.value === true || !UNSAFE_VALUE.test(prop.value);
}

/** A value of Comark has no escape. A JSX string cannot hold its own quote. */
function formatProp(prop: Prop): string {
	if (prop.value === true) return prop.name;
	const quote = S.includes(prop.value, '"') ? "'" : '"';
	return `${prop.name}=${quote}${prop.value}${quote}`;
}

function blockOpener(name: string, props: readonly Prop[]): string {
	const attributes = pipe(props, A.map(formatProp), A.join(" "));
	const block = `::${kebabCase(name)}`;
	return S.isEmpty(attributes) ? block : `${block}{${attributes}}`;
}

/** Text that stays. No block of Comark can start after it: an HTML block can hold it. */
function keepLines(level: Level, range: { from: number; to: number }): Step {
	const { from, to } = range;
	const lines = A.slice(level.source.lines, from, to - from + 1);
	const kept = keptNames(lines, level.opened);
	return { lines, kept, next: to + 1, block: isBlank(lines.at(-1) ?? "") };
}

/** An element converts only in the clear case. Else it stays as it is, with its children. */
function convertElement(level: Level, index: number): Step {
	const { source, closers, depth } = level;
	const tag = readTag(source, index);
	const keep = (to: number) => keepLines(level, { from: index, to });
	if (tag.status === "broken") return keep(index);
	const tagLast = lineOf(source, tag.end - 1);
	const closer = tag.selfClosing
		? { line: tagLast, height: 1 }
		: closers.get(index);
	if (closer === undefined || !isBlank(restOfLine(source, tag)))
		return keep(tagLast);
	const plain =
		!tag.expression &&
		COMARK_NAME.test(tag.name) &&
		A.all(tag.props, fitsComark);
	const size = closer.line - tagLast - 1;
	const children = dedent(A.slice(source.lines, tagLast + 1, size));
	const unsafe = pipe(children, textLines, A.some(isUnsafeChild));
	if (!plain || unsafe || depth + closer.height > MAX_DEPTH)
		return keep(closer.line);
	const inner = convertText(A.join(children, "\n"), depth + 1);
	if (!A.isEmpty(inner.kept)) return keep(closer.line);
	const body = A.isEmpty(children) ? [] : S.split(inner.body, "\n");
	const lines = [blockOpener(tag.name, tag.props), ...body, "::"];
	return { lines, kept: [], next: closer.line + 1, block: true };
}

/** A block starts at the first line, after a blank line, or a converted element. A fence keeps the state. */
function convertStep(
	level: Level,
	at: { index: number; block: boolean },
): Step {
	const { index } = at;
	const fence = fenceEnd(level.source.lines, index);
	if (O.isSome(fence)) {
		const lines = A.slice(level.source.lines, index, fence - index + 1);
		return { lines, kept: [], next: fence + 1, block: at.block };
	}
	if (at.block && COMPONENT_START.test(lineAt(level.source, index)))
		return convertElement(level, index);
	return keepLines(level, { from: index, to: index });
}

function convertText(text: string, depth: number): ComarkBody {
	const source = toSource(text);
	const closers = matchClosers(source);
	const level = { source, closers, depth, opened: new Map<string, number>() };
	const parts: Step[] = [];
	let at = { index: 0, block: true };
	while (at.index < source.lines.length) {
		const step = convertStep(level, at);
		parts.push(step);
		at = { index: step.next, block: step.block };
	}
	const lines = A.flatMap(parts, (part) => part.lines);
	return {
		body: A.join(lines, "\n"),
		kept: A.flatMap(parts, (part) => part.kept),
	};
}

/** Changes the MDX syntax of a body to Comark. `docs/notes.md` has the rules. */
export function mdxToComark(body: string): ComarkBody {
	const normal = S.replaceByRe(body, /\r\n/g, "\n");
	const text = withoutImports(normal);
	// A blank line keeps a `---` that the imports hid from a read as frontmatter.
	const head = text !== normal && S.startsWith(text, "---") ? "\n" : "";
	return convertText(`${head}${text}`, 0);
}
