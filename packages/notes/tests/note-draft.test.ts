import { A } from "@mobily/ts-belt";
import { describe, expect, it } from "vitest";
import type { FieldDefinition } from "../src/field-definitions";
import { NOTE_BODY_MAX_BYTES, noteDraftSchema } from "../src/note-draft";

const LANGUAGES = { languages: ["en", "id"], defaultLanguage: "en" };

const FIELDS: readonly FieldDefinition[] = [
	{ name: "featured", label: "Featured", type: "boolean", required: true },
	{ name: "series", label: "Series", type: "text", required: false },
	{
		name: "relatedPosts",
		label: "Related posts",
		type: "list",
		required: false,
	},
];

const DRAFT = {
	title: "Jotai recipes",
	slug: "jotai-recipes",
	language: "en",
	fields: { featured: false },
	body: "# Jotai recipes",
};

const schema = noteDraftSchema({ languages: LANGUAGES, fields: FIELDS });

function messages(input: unknown): readonly string[] {
	const parsed = schema.safeParse(input);
	if (parsed.success) return [];
	return A.map(parsed.error.issues, (issue) => issue.message);
}

describe("noteDraftSchema", () => {
	it("accepts a draft, and gives the default description and keywords", () => {
		expect(schema.parse(DRAFT)).toEqual({
			...DRAFT,
			description: "",
			keywords: [],
		});
	});

	it("keeps an extra field that the settings do not define", () => {
		const draft = { ...DRAFT, fields: { featured: true, mood: "calm" } };
		expect(schema.parse(draft).fields).toEqual({
			featured: true,
			mood: "calm",
		});
	});

	it("refuses a language that the CMS does not have", () => {
		expect(messages({ ...DRAFT, language: "fr" })).toEqual([
			"Choose a language of this CMS.",
		]);
	});

	it("refuses a missing required field", () => {
		expect(messages({ ...DRAFT, fields: {} })).toEqual([
			"Give Featured a value.",
		]);
	});

	it("refuses a value of the wrong type", () => {
		expect(
			messages({ ...DRAFT, fields: { featured: true, series: 3 } }),
		).toEqual(["Series needs a text."]);
	});

	it("refuses an empty value of a required text or list", () => {
		const required = noteDraftSchema({
			languages: LANGUAGES,
			fields: [
				{ name: "series", label: "Series", type: "text", required: true },
				{ name: "tags", label: "Tags", type: "list", required: true },
			],
		});
		const parsed = required.safeParse({
			...DRAFT,
			fields: { series: "  ", tags: [] },
		});
		expect(parsed.success).toBe(false);
		expect(A.map(parsed.error?.issues ?? [], (issue) => issue.path)).toEqual([
			["fields", "series"],
			["fields", "tags"],
		]);
	});

	it("accepts a body at the size limit, and refuses one byte more", () => {
		const body = "a".repeat(NOTE_BODY_MAX_BYTES);
		expect(schema.safeParse({ ...DRAFT, body }).success).toBe(true);
		expect(messages({ ...DRAFT, body: `${body}a` })).toEqual([
			"Keep the post at 1 MB or less.",
		]);
	});
});
