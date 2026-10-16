import { describe, expect, it } from "vitest";
import { CORE_FIELDS, noteMetadataSchema } from "../src/metadata";

const draft = {
	title: "  Git hooks with Lefthook ",
	slug: "git-hooks-with-lefthook",
	language: "EN",
	status: "draft",
	publishedAt: null,
	updatedAt: "2026-10-16T12:00:00.000Z",
};

describe("noteMetadataSchema", () => {
	it("accepts a draft, and fills the optional fields", () => {
		expect(noteMetadataSchema.parse(draft)).toEqual({
			...draft,
			title: "Git hooks with Lefthook",
			language: "en",
			description: "",
			keywords: [],
		});
	});

	it("accepts a published note with its date", () => {
		const result = noteMetadataSchema.safeParse({
			...draft,
			status: "published",
			publishedAt: "2026-09-27T08:00:00.000Z",
			keywords: ["lefthook", "biome"],
		});
		expect(result.success).toBe(true);
	});

	it("refuses a published note with no publishedAt date", () => {
		const result = noteMetadataSchema.safeParse({
			...draft,
			status: "published",
		});
		expect(result.error?.issues[0]?.path).toEqual(["publishedAt"]);
	});

	it.each([
		["an empty title", { title: "   " }],
		["a wrong slug", { slug: "Git Hooks" }],
		["a wrong language", { language: "english" }],
		["an unknown status", { status: "archived" }],
		["a date that is not ISO 8601", { updatedAt: "10/16/2026" }],
	])("refuses %s", (_name, change) => {
		expect(noteMetadataSchema.safeParse({ ...draft, ...change }).success).toBe(
			false,
		);
	});

	it("names each core field of the schema", () => {
		expect(Object.keys(noteMetadataSchema.parse(draft)).sort()).toEqual(
			[...CORE_FIELDS].sort(),
		);
	});
});
