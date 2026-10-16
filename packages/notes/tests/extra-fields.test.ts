import { describe, expect, it } from "vitest";
import { EXTRA_FIELDS_MAX, extraFieldsSchema } from "../src/extra-fields";

describe("extraFieldsSchema", () => {
	it("keeps text, numbers, true or false, and lists of text", () => {
		const fields = {
			featured: true,
			author: "rimzzlabs",
			readingMinutes: 7,
			relatedPosts: ["how-to-setup-husky-nextjs"],
		};
		expect(extraFieldsSchema.parse(fields)).toEqual(fields);
	});

	it("refuses a field with the name of a core field", () => {
		const result = extraFieldsSchema.safeParse({ title: "Another title" });
		expect(result.error?.issues[0]?.message).toBe(
			"title is a core field. Give the extra field a different name.",
		);
	});

	it.each([["related-posts"], ["1st"], ["__proto__"], ["a".repeat(41)]])(
		"refuses the name %s",
		(key) => {
			expect(
				extraFieldsSchema.safeParse(JSON.parse(`{"${key}": "x"}`)).success,
			).toBe(false);
		},
	);

	it("refuses a value that is an object or null", () => {
		expect(extraFieldsSchema.safeParse({ cover: { url: "x" } }).success).toBe(
			false,
		);
		expect(extraFieldsSchema.safeParse({ cover: null }).success).toBe(false);
	});

	it("refuses more fields than the maximum", () => {
		const fields = Object.fromEntries(
			Array.from({ length: EXTRA_FIELDS_MAX + 1 }, (_value, index) => [
				`field${index}`,
				index,
			]),
		);
		expect(
			extraFieldsSchema.safeParse(fields).error?.issues[0]?.message,
		).toContain("extra fields or fewer");
	});
});
