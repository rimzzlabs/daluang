import { A } from "@mobily/ts-belt";
import { parseMarkdown } from "comark";
import { describe, expect, it } from "vitest";
import { mdxToComark } from "../src/mdx-to-comark";

const CALLOUT =
	'<Callout type="note">\n  **In short:**\n\n  - one\n\n  ```js\n  a\n  ```\n</Callout>';
const IMAGE =
	'<NoteImage\n  images={[\n    { src: A, alt: "a { b }" },\n  ]}\n/>';
const DEEP = `${"<A>\n".repeat(8)}x\n${"</A>\n".repeat(8)}`;
const DEEP_NODE = A.reduce(A.range(1, 7), ["a", {}, "x"], (n) => ["a", {}, n]);
const BROKEN =
	"<Callout\n<Tabs>\n<Tab>\n<Callout>\n</Callout>\n</Tab>\n</Tabs>\n- item 2\n<Callout>\n</Callout>";

/** Each input that converts, its output, its kept names, and one node of Comark in it. */
// biome-ignore format: one row on each line reads as a table.
const CONVERTED: [string, string, string[], unknown][] = [
	[
		`import A from "a";\n\n${CALLOUT}`,
		'::callout{type="note"}\n**In short:**\n\n- one\n\n```js\na\n```\n::',
		[],
		[
			"callout",
			{ type: "note" },
			["p", {}, ["strong", {}, "In short:"]],
			["ul", {}, ["li", {}, "one"]],
			["pre", { language: "js" }, ["code", { class: "language-js" }, "a"]],
		],
	],
	["<NoteImage lang='en' wide caption='A \"big\" view' />\n\nText", `::note-image{lang="en" wide caption='A "big" view'}\n::\n\nText`, [], ["note-image", { lang: "en", ":wide": "true", caption: 'A "big" view' }]],
	['<Steps>\r\n  <Step title="One">\r\n    First *step*\r\n  </Step>\r\n</Steps>', '::steps\n::step{title="One"}\nFirst *step*\n::\n::', [], ["steps", {}, ["step", { title: "One" }, "First ", ["em", {}, "step"]]]],
	["```\n<A>\n```\n<C>\n  x\n</C>", "```\n<A>\n```\n::c\nx\n::", [], ["c", {}, "x"]],
	["<I s={A} />\n\n<C>\nT\n</C>", "<I s={A} />\n\n::c\nT\n::", ["I"], ["c", {}, "T"]],
	['import A from "a";\n\n---\nt: x\n---\nT', "\n---\nt: x\n---\nT", [], ["hr", {}]],
	[DEEP, `${"::a\n".repeat(8)}x\n${"::\n".repeat(8)}`, [], DEEP_NODE],
	['<C t="a > b">\nx\n</C>', '::c{t="a > b"}\nx\n::', [], ["c", { t: "a > b" }, "x"]],
];

/** Each input that stays as it is, with the names in `kept`. The first ones have no MDX. */
const KEPT: [string, string[]][] = [
	["", []],
	["\n", []],
	["# Title\n\nText with **bold**.\n", []],
	[IMAGE, ["NoteImage"]],
	["<Chart {...props}>\n  <Bar />\n</Chart>", ["Chart", "Bar"]],
	['<Dial client:visible lang="en" />', ["Dial"]],
	['<Quote by="Ann\n  Lee" />', ["Quote"]],
	['<Callout title="a\\">\nx\n</Callout>', ["Callout"]],
	['<Callout title="a &amp; b">\nx\n</Callout>', ["Callout"]],
	["<My_Comp>\nx\n</My_Comp>", ["My_Comp"]],
	["<Kbd>Ctrl</Kbd> + <Kbd>C</Kbd>", ["Kbd", "Kbd"]],
	["<Callout>\nfirst\n\n::\n\nsecond\n</Callout>", ["Callout"]],
	["<Callout>\nHi {name}\n</Callout>", ["Callout"]],
	["Write `a\n<Foo />\nb` here.", ["Foo"]],
	["A <Badge />, `<Code />`, `` <Two /> ``, and <br />.", ["Badge"]],
	["<B /> and ` tick", ["B"]],
	["Text\n<Callout>\nx\n</Callout>", ["Callout"]],
	["# Title\n<Callout>\nx\n</Callout>", ["Callout"]],
	["- item\n<Callout>\nx\n</Callout>", ["Callout"]],
	["<I s={A} />\n<C>\n  T\n</C>\n\nAfter", ["I", "C"]],
	["<A>\n<B>\n</A>\n</B>", ["A", "B"]],
	["<A>\n</B>\n</A>", ["A", "B"]],
	["<Callout>\n  Text\n\n## Next", ["Callout"]],
	["<Foo bar=baz>\nText", ["Foo"]],
	[
		"<Img src={a} />\n```\nx\n```\n<Callout>\nc\n</Callout>",
		["Img", "Callout"],
	],
	["A <B /> here\n\n</B>", ["B", "B"]],
	[`<Callout\n${'  a="b"\n'.repeat(32)}>\nx\n</Callout>`, ["Callout"]],
	[BROKEN, ["Callout", "Tabs", "Tab", "Callout", "Callout"]],
	[`${"<A>\n".repeat(9)}Deep\n${"</A>\n".repeat(9)}`, Array(9).fill("A")],
];

describe("mdxToComark", () => {
	it.each(CONVERTED)("converts %j", async (body, output, kept, node) => {
		const result = mdxToComark(body);
		expect(result).toEqual({ body: output, kept });
		const document = await parseMarkdown(result.body);
		expect(document.nodes).toContainEqual(node);
		expect(document.frontmatter).toEqual({});
	});

	it.each(KEPT)("keeps %j", (body, kept) => {
		expect(mdxToComark(body)).toEqual({ body, kept });
	});

	const all = [...CONVERTED, ...KEPT].map((row) => row[0]);
	it.each(all)("changes nothing more in a second run of %j", (body) => {
		const once = mdxToComark(body).body;
		expect(mdxToComark(once).body).toBe(once);
	});
});
