import { A } from "@mobily/ts-belt";
import { describe, expect, it } from "vitest";
import type { FieldDefinition } from "../src/field-definitions";
import {
	isUntitledSlug,
	NOTE_BODY_MAX_BYTES,
	noteDraftSchema,
	publishedDraftSchema,
	untitledDraft,
} from "../src/note-draft";

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
			"This language is not in the settings of the CMS. Choose another language.",
		]);
	});

	it("accepts a missing required field: Publish asks for it", () => {
		expect(messages({ ...DRAFT, fields: {} })).toEqual([]);
	});

	it("refuses a value of the wrong type", () => {
		expect(
			messages({ ...DRAFT, fields: { featured: true, series: 3 } }),
		).toEqual(["Series needs a text."]);
	});

	it("accepts an empty value of a required text in a saved draft", () => {
		const saved = noteDraftSchema({
			languages: LANGUAGES,
			fields: [
				{ name: "series", label: "Series", type: "text", required: true },
			],
		});
		expect(saved.safeParse({ ...DRAFT, fields: { series: "" } }).success).toBe(
			true,
		);
	});

	it("accepts a body at the size limit, and refuses one byte more", () => {
		const body = "a".repeat(NOTE_BODY_MAX_BYTES);
		expect(schema.safeParse({ ...DRAFT, body }).success).toBe(true);
		expect(messages({ ...DRAFT, body: `${body}a` })).toEqual([
			"Keep the post at 1 MB or less.",
		]);
	});
});

describe("publishedDraftSchema", () => {
	it("refuses a missing required field", () => {
		const published = publishedDraftSchema({
			languages: LANGUAGES,
			fields: FIELDS,
		});
		expect(published.safeParse({ ...DRAFT, fields: {} }).error?.issues).toEqual(
			[expect.objectContaining({ message: "Give Featured a value." })],
		);
	});

	it("refuses an empty value of a required text or list", () => {
		const required = publishedDraftSchema({
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
});

describe("untitledDraft", () => {
	const rules = { languages: LANGUAGES, fields: FIELDS };

	it("gives an empty draft in the default language", () => {
		expect(untitledDraft({ notes: [], rules })).toEqual({
			title: "Untitled",
			slug: "untitled",
			language: "en",
			description: "",
			keywords: [],
			fields: {},
			body: "",
		});
	});

	it("numbers the title and the slug when the language has the slug", () => {
		const notes = [
			{ slug: "untitled", language: "en" },
			{ slug: "untitled-2", language: "en" },
			{ slug: "untitled-3", language: "id" },
		];
		const draft = untitledDraft({ notes, rules });
		expect([draft.title, draft.slug]).toEqual(["Untitled 3", "untitled-3"]);
	});

	it("gives a draft that the schema of a save accepts", () => {
		expect(schema.safeParse(untitledDraft({ notes: [], rules })).success).toBe(
			true,
		);
	});
});

describe("isUntitledSlug", () => {
	it.each([
		["untitled", true],
		["untitled-12", true],
		["untitled-post", false],
		["my-untitled", false],
	])("%s gives %s", (slug, expected) => {
		expect(isUntitledSlug(slug)).toBe(expected);
	});
});
