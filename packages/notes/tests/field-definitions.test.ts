import { describe, expect, it } from "vitest";
import { EXTRA_FIELDS_MAX } from "../src/extra-fields";
import {
	fieldDefinitionSchema,
	fieldDefinitionsSchema,
	fieldNameFromLabel,
} from "../src/field-definitions";

const FEATURED = {
	name: "featured",
	label: "Featured",
	type: "boolean",
	required: true,
} as const;

describe("fieldDefinitionSchema", () => {
	it("keeps a field and trims its label", () => {
		expect(
			fieldDefinitionSchema.parse({ ...FEATURED, label: " Featured " }),
		).toEqual(FEATURED);
	});

	it.each([
		["a name with a hyphen", { name: "related-posts" }, "Start the name"],
		["a core field", { name: "title" }, "Each note has this core field"],
		["an empty label", { label: " " }, "Give the field a label."],
	])("refuses %s", (_name, change, message) => {
		const result = fieldDefinitionSchema.safeParse({ ...FEATURED, ...change });
		expect(result.error?.issues[0]?.message).toContain(message);
	});

	it("refuses a type that is not a kind of value", () => {
		expect(
			fieldDefinitionSchema.safeParse({ ...FEATURED, type: "date" }).success,
		).toBe(false);
	});
});

describe("fieldDefinitionsSchema", () => {
	it("refuses a second field with the same name, at the second field", () => {
		const result = fieldDefinitionsSchema.safeParse([FEATURED, FEATURED]);
		expect(result.error?.issues).toEqual([
			expect.objectContaining({
				path: [1, "name"],
				message: "Another field has this name. Give each field its own name.",
			}),
		]);
	});

	it("refuses more fields than the maximum", () => {
		const fields = Array.from({ length: EXTRA_FIELDS_MAX + 1 }, (_, index) => ({
			...FEATURED,
			name: `field${index}`,
		}));
		expect(fieldDefinitionsSchema.safeParse(fields).success).toBe(false);
	});
});

describe("fieldNameFromLabel", () => {
	it.each([
		["Related posts", "relatedPosts"],
		["Featured", "featured"],
		["Café menu", "cafeMenu"],
		["  Reading time (minutes) ", "readingTimeMinutes"],
		["3 tips", "tips"],
		["!!!", ""],
		["a".repeat(50), "a".repeat(40)],
	])("gives %s as %s", (label, name) => {
		expect(fieldNameFromLabel(label)).toBe(name);
	});
});
