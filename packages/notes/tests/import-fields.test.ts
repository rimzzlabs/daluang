import { O } from "@mobily/ts-belt";
import { describe, expect, it } from "vitest";
import {
	importFields,
	importKeywords,
	isPresent,
	textOf,
} from "../src/import-fields";

function leftOut(names: readonly string[]) {
	return names.map((name) => ({ code: "field-left-out", name }));
}

describe("isPresent", () => {
	it.each([
		[null, false],
		[undefined, false],
		["", true],
		[0, true],
		[false, true],
	])("gives %j for %j", (value, present) => {
		expect(isPresent(value)).toBe(present);
	});
});

describe("textOf", () => {
	it.each([
		[" A ", O.Some("A")],
		[2024, O.Some("2024")],
		[1.5, O.Some("1.5")],
		["  ", O.None],
		[Number.NaN, O.None],
		[Number.POSITIVE_INFINITY, O.None],
		[true, O.None],
		[["a"], O.None],
		[null, O.None],
	])("reads %j", (value, text) => {
		expect(textOf(value)).toEqual(text);
	});
});

describe("importKeywords", () => {
	it.each([
		["a, b ,, c", ["a", "b", "c"]],
		[5, ["5"]],
		[
			[" x ", 5, "", null],
			["x", "5"],
		],
		[["a", ["b"], { c: 1 }], ["a"]],
		[{ a: 1 }, []],
		[undefined, []],
	])("reads %j", (value, keywords) => {
		expect(importKeywords(value)).toEqual(keywords);
	});
});

describe("importFields", () => {
	it("reads the extra fields, and leaves out a key that cannot be a field", () => {
		const frontmatter = JSON.parse(
			'{"__proto__":"x","constructor":"c","toString":"t","obj":{"a":1},"none":null,"n":3,"list":["a",1],"lang":"id","language":"id","title":"A"}',
		);
		const { fields, warnings } = importFields(frontmatter);
		expect(fields).toEqual({ constructor: "c", toString: "t", n: 3 });
		expect(Object.getPrototypeOf(fields)).toBe(Object.prototype);
		expect(warnings).toEqual(leftOut(["__proto__", "obj", "list"]));
	});

	it.each([
		[{ keywords: "a, b", slug: 7, description: 1.5, status: "x" }, []],
		[{ keywords: [" x ", 5, "", null] }, []],
		[{ keywords: ["a", ["b"], { c: 1 }] }, ["keywords"]],
		[{ keywords: { a: 1 } }, ["keywords"]],
		[
			{ status: true, slug: { a: 1 }, description: ["a"] },
			["slug", "description", "status"],
		],
		[{ slug: null, description: null, keywords: null, status: null }, []],
	])(
		"gives a warning for each core key of another kind in %j",
		(frontmatter, names) => {
			expect(importFields(frontmatter)).toEqual({
				fields: {},
				warnings: leftOut(names),
			});
		},
	);

	it("gives the core keys first, then the extra keys in their order", () => {
		const frontmatter = { "bad-name": "x", b: { c: 1 }, slug: ["a"] };
		expect(importFields(frontmatter).warnings).toEqual(
			leftOut(["slug", "bad-name", "b"]),
		);
	});
});
