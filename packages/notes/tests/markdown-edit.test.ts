import { describe, expect, it } from "vitest";
import { type MarkdownEdit, markdownEdit } from "../src/markdown-edit";

/**
 * Applies an edit to a text that marks its selection with « and », and gives the new text
 * with its new selection in the same marks. `a«»b` is a cursor between `a` and `b`.
 */
function apply(edit: MarkdownEdit, marked: string): string {
	const from = marked.indexOf("«");
	const to = marked.indexOf("»") - 1;
	const text = marked.replace("«", "").replace("»", "");
	const change = markdownEdit(edit, { text, selection: { from, to } });
	const next =
		text.slice(0, change.from) + change.insert + text.slice(change.to);
	const { selection } = change;
	return `${next.slice(0, selection.from)}«${next.slice(selection.from, selection.to)}»${next.slice(selection.to)}`;
}

describe("markdownEdit: inline marks", () => {
	it.each<[MarkdownEdit, string, string]>([
		["bold", "a «word» b", "a **«word»** b"],
		["italic", "a «word» b", "a _«word»_ b"],
		["strikethrough", "a «word» b", "a ~~«word»~~ b"],
		["code", "a «word» b", "a `«word»` b"],
	])("%s wraps the selection", (edit, before, after) => {
		expect(apply(edit, before)).toBe(after);
	});

	it("removes the marks of a wrapped selection", () => {
		expect(apply("bold", "a **«word»** b")).toBe("a «word» b");
	});

	it("puts the cursor between two new marks", () => {
		expect(apply("bold", "a «»")).toBe("a **«»**");
	});

	it("wraps a selection at the start of the text", () => {
		expect(apply("italic", "«word»")).toBe("_«word»_");
	});
});

describe("markdownEdit: line prefixes", () => {
	it("makes the line of the cursor a heading, and keeps the cursor in its text", () => {
		expect(apply("heading", "one\ntw«»o\nthree")).toBe("one\n## tw«»o\nthree");
	});

	it("changes another heading level, and removes the heading", () => {
		expect(apply("heading", "#### T«»itle")).toBe("## T«»itle");
		expect(apply("heading", "## T«»itle")).toBe("T«»itle");
	});

	it("quotes each selected line, then removes the quotes", () => {
		expect(apply("quote", "«one\ntwo»")).toBe("> «one\n> two»");
		expect(apply("quote", "> «one\n> two»")).toBe("«one\ntwo»");
	});

	it("numbers each selected line", () => {
		expect(apply("numbered-list", "«one\ntwo\nthree»")).toBe(
			"1. «one\n2. two\n3. three»",
		);
	});

	it("adds a bullet to each line when one line has none", () => {
		expect(apply("bullet-list", "«- one\ntwo»")).toBe("«- one\n- two»");
	});

	it("keeps the selection in the line when a prefix goes", () => {
		expect(apply("bullet-list", "«»- one")).toBe("«»one");
	});
});

describe("markdownEdit: blocks", () => {
	it("makes a link of the selection, and selects the URL", () => {
		expect(apply("link", "see «docs» now")).toBe("see [docs](«https://») now");
		expect(apply("link", "«»")).toBe("[text](«https://»)");
	});

	it("puts the selected lines in a code block", () => {
		expect(apply("code-block", "a\n«let x»\nb")).toBe(
			"a\n```\n«let x»\n```\nb",
		);
	});

	it("selects the placeholder of an empty callout", () => {
		expect(apply("callout", "«»")).toBe(
			'::callout{type="note"}\n«Text of the callout»\n::',
		);
	});

	it("puts a rule after the line, with an empty line before it", () => {
		expect(apply("rule", "te«»xt\nnext")).toBe("text\n\n---\n«»\nnext");
		expect(apply("rule", "«»")).toBe("---\n«»");
	});

	it("puts a table after the line", () => {
		expect(apply("table", "text«»")).toBe(
			"text\n\n| Column | Column |\n| ------ | ------ |\n| Text   | Text   |\n«»",
		);
	});
});
