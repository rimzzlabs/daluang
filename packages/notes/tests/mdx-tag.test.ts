import { describe, expect, it } from "vitest";
import { parseTag } from "../src/mdx-tag";

describe("parseTag", () => {
	it("reads plain props, a prop with no value, and the end of the tag", () => {
		const text = `<Callout type="note" title='A "b"' open>Text`;
		expect(parseTag(text, 0)).toEqual({
			status: "parsed",
			name: "Callout",
			props: [
				{ name: "type", value: "note" },
				{ name: "title", value: 'A "b"' },
				{ name: "open", value: true },
			],
			expression: false,
			selfClosing: false,
			end: text.indexOf(">") + 1,
		});
	});

	it("reads a self-closing tag on more than one line, after an offset", () => {
		const text = 'Text\n<Image\n  src="a.png"\n/>';
		expect(parseTag(text, 5)).toMatchObject({
			status: "parsed",
			name: "Image",
			selfClosing: true,
			end: text.length,
		});
	});

	it.each([
		'<Image images={[{ src: A, alt: "a } b" }, { alt: `c {` }]} lang="en" />',
		"<Chart {...props}>",
		"<Note text={'it\\'s }'}>",
	])("marks an expression in %j", (text) => {
		expect(parseTag(text, 0)).toMatchObject({
			status: "parsed",
			expression: true,
			end: text.length,
		});
	});

	it.each<[string, number]>([
		["<Foo.Bar />", 4],
		["<Foo bar=baz>", 5],
		["<Foo =x>", 5],
		['<Foo a="never\nmore', 18],
		["<Foo a={never\nmore", 18],
		["<Foo", 4],
		["<Foo a", 6],
	])("breaks %j at %i", (text, end) => {
		expect(parseTag(text, 0)).toEqual({ status: "broken", name: "Foo", end });
	});
});
