import { R } from "@mobily/ts-belt";
import { parseMarkdown } from "comark";
import { describe, expect, it } from "vitest";
import { type FileParts, readFrontmatter } from "../src/frontmatter";

async function parts(text: string): Promise<FileParts> {
	const result = await readFrontmatter(text);
	if (R.isError(result)) throw new Error("expected Ok");
	return R.getExn(result);
}

describe("readFrontmatter", () => {
	it("reads the YAML block and gives the text after it", async () => {
		const text = "---\ntitle: A\ntags: [a, 5]\nday: 2023-09-30\n---\n# Body\n";
		expect(await parts(text)).toEqual({
			frontmatter: { title: "A", tags: ["a", 5], day: "2023-09-30" },
			body: "# Body\n",
		});
	});

	it.each([
		["\\r\\n line endings", "---\r\ntitle: A\r\n---\r\nBody\r\n", "Body\r\n"],
		["spaces after a fence", "--- \ntitle: A\n---\t\nBody", "Body"],
		["a closing line at the end", "---\ntitle: A\n---", ""],
		["a BOM", "\uFEFF---\ntitle: A\n---\nBody\uFEFF", "Body\uFEFF"],
	])("reads a block with %s", async (_name, text, body) => {
		expect(await parts(text)).toEqual({ frontmatter: { title: "A" }, body });
	});

	it.each([
		["", ""],
		["# Title\n\nText\n", "# Title\n\nText\n"],
		["\uFEFF# Title", "# Title"],
		["\n\n \t\nText", "Text"],
		[" ---\ntitle: A\n---\nText", " ---\ntitle: A\n---\nText"],
		["---\ntitle: A\nText", "\n---\ntitle: A\nText"],
		["---", "\n---"],
	])("gives the whole text of %j as the body", async (text, body) => {
		expect(await parts(text)).toEqual({ frontmatter: {}, body });
	});

	it.each([
		["an empty block", "---\n---\nText"],
		["a block of blank lines", "---\n\n  \n---\nText"],
		["a block of comments", "---\n# A comment\n---\nText"],
		["a null block", "---\nnull\n---\nText"],
	])("gives an empty frontmatter for %s", async (_name, text) => {
		expect(await parts(text)).toEqual({ frontmatter: {}, body: "Text" });
	});

	it.each([
		["YAML that does not parse", "---\ntitle: A\nb: [1\nc: : :\n---\nText"],
		["a list", "---\n- a\n- b\n---\nText"],
		["a text", "---\nhello\n---\nText"],
		["a number", "---\n5\n---\nText"],
		["a line that starts with ---", "---\ntitle: A\n----\nb: 1\n---\nText"],
		["a second document", "---\ntitle: A\n--- b: 1\n---\nText"],
	])("gives the error frontmatter-not-read for %s", async (_name, text) => {
		expect(await readFrontmatter(text)).toEqual(
			R.Error("frontmatter-not-read"),
		);
	});

	it("removes the blank lines at the start of the body", async () => {
		const text = "---\ntitle: A\n---\n\n \n\t\nText\n\nMore";
		expect((await parts(text)).body).toBe("Text\n\nMore");
	});

	it.each([
		[
			"---\ntitle: A\n---\n\n---\n\nIntro\n\n---\n\nMore",
			"\n---\n\nIntro\n\n---\n\nMore",
			"hr",
		],
		[
			"---\ntitle: A\n---\n---\nIntro\n---\nMore",
			"\n---\nIntro\n---\nMore",
			"hr",
		],
		[
			"---\ntitle: A\n---\n\n\n--- x\nIntro\n---\nMore",
			"\n--- x\nIntro\n---\nMore",
			"h2",
		],
	])(
		"keeps the text of a body that starts with ---",
		async (text, body, tag) => {
			const read = await parts(text);
			expect(read).toEqual({ frontmatter: { title: "A" }, body });
			const document = await parseMarkdown(read.body);
			expect(document.frontmatter).toEqual({});
			expect(document.nodes[0]?.[0]).toBe(tag);
			expect(JSON.stringify(document.nodes)).toContain("Intro");
		},
	);

	it("keeps a prototype key as data", async () => {
		const text =
			"---\n__proto__:\n  polluted: 1\nconstructor: c\ntoString: t\n---\n";
		const { frontmatter } = await parts(text);
		expect(Object.getPrototypeOf(frontmatter)).toBe(Object.prototype);
		expect(Object.keys(frontmatter)).toEqual([
			"__proto__",
			"constructor",
			"toString",
		]);
		expect(Object.getOwnPropertyDescriptor(frontmatter, "__proto__")).toEqual(
			expect.objectContaining({ value: { polluted: 1 } }),
		);
		expect(frontmatter.constructor).toBe("c");
		expect(Reflect.get({}, "polluted")).toBeUndefined();
	});

	it("does not parse a long body", async () => {
		const body = "<Note>\n{x}\n</Note>\n".repeat(60_000);
		expect(await parts(`---\ntitle: A\n---\n${body}`)).toEqual({
			frontmatter: { title: "A" },
			body,
		});
	});
});
