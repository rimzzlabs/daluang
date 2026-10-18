import { R } from "@mobily/ts-belt";
import { describe, expect, it } from "vitest";
import type { FieldDefinition } from "../src/field-definitions";
import {
	emptyNoteForm,
	type NoteForm,
	noteFormOf,
	parseNoteForm,
	withSlug,
	withTitle,
} from "../src/note-form";

const FIELDS: readonly FieldDefinition[] = [
	{ name: "featured", label: "Featured", type: "boolean", required: false },
	{
		name: "readingTime",
		label: "Reading time",
		type: "number",
		required: false,
	},
	{ name: "series", label: "Series", type: "text", required: true },
	{
		name: "relatedPosts",
		label: "Related posts",
		type: "list",
		required: false,
	},
];

const RULES = {
	languages: { languages: ["en", "id"], defaultLanguage: "id" },
	fields: FIELDS,
};

function filled(): NoteForm {
	return {
		...withTitle(emptyNoteForm(RULES), "Jotai recipes"),
		description: "Small recipes.",
		keywords: "react, jotai, ,state",
		fields: {
			featured: true,
			readingTime: "7",
			series: "React",
			relatedPosts: "a, b",
		},
		body: "# Jotai",
	};
}

describe("emptyNoteForm", () => {
	it("starts in the default language, with an empty input for each field", () => {
		expect(emptyNoteForm(RULES)).toEqual({
			title: "",
			slug: "",
			slugTouched: false,
			language: "id",
			description: "",
			keywords: "",
			fields: {
				featured: false,
				readingTime: "",
				series: "",
				relatedPosts: "",
			},
			kept: {},
			body: "",
		});
	});
});

describe("withTitle and withSlug", () => {
	it("makes the slug from the title until the writer types a slug", () => {
		const titled = withTitle(emptyNoteForm(RULES), "Resep Jotai");
		expect(titled.slug).toBe("resep-jotai");
		const typed = withSlug(titled, "jotai");
		expect(withTitle(typed, "Resep lain").slug).toBe("jotai");
	});

	it("follows the title again after the writer clears the slug", () => {
		const cleared = withSlug(withSlug(emptyNoteForm(RULES), "x"), "");
		expect(withTitle(cleared, "Baru").slug).toBe("baru");
	});
});

describe("parseNoteForm", () => {
	it("gives the draft, with a value of the type of each field", () => {
		expect(parseNoteForm(filled(), RULES)).toEqual(
			R.Ok({
				title: "Jotai recipes",
				slug: "jotai-recipes",
				language: "id",
				description: "Small recipes.",
				keywords: ["react", "jotai", "state"],
				fields: {
					featured: true,
					readingTime: 7,
					series: "React",
					relatedPosts: ["a", "b"],
				},
				body: "# Jotai",
			}),
		);
	});

	it("leaves out an empty optional field", () => {
		const form = {
			...filled(),
			fields: { featured: false, readingTime: " ", series: "React" },
		};
		expect(R.getExn(parseNoteForm(form, RULES)).fields).toEqual({
			featured: false,
			series: "React",
		});
	});

	it("gives the message of each value that is not valid, by its path", () => {
		const form = {
			...filled(),
			title: " ",
			language: "fr",
			fields: { ...filled().fields, readingTime: "seven", series: "" },
		};
		const errors = R.match(
			parseNoteForm(form, RULES),
			() => ({}),
			(found) => found,
		);
		expect(errors).toEqual({
			title: "Give the post a title.",
			language: "Choose a language of this CMS.",
			"fields.readingTime": "Reading time needs a number.",
			"fields.series": "Give Series a value.",
		});
	});
});

describe("noteFormOf", () => {
	const NOTE = {
		id: "n1",
		title: "Jotai recipes",
		slug: "jotai",
		language: "en",
		description: "Small recipes.",
		keywords: ["react", "jotai"],
		status: "draft" as const,
		publishedAt: null,
		updatedAt: "2026-10-18T12:00:00.000Z",
		createdAt: "2026-10-18T12:00:00.000Z",
		fields: {
			featured: true,
			readingTime: 7,
			relatedPosts: ["a", "b"],
			legacyId: "old-1",
		},
		body: "# Jotai",
		published: null,
		mark: null,
	};

	it("gives the input of each stored value, and keeps the slug", () => {
		const form = noteFormOf(NOTE, FIELDS);
		expect(form).toEqual({
			title: "Jotai recipes",
			slug: "jotai",
			slugTouched: true,
			language: "en",
			description: "Small recipes.",
			keywords: "react, jotai",
			fields: {
				featured: true,
				readingTime: "7",
				series: "",
				relatedPosts: "a, b",
			},
			kept: { legacyId: "old-1" },
			body: "# Jotai",
		});
		expect(withTitle(form, "New title").slug).toBe("jotai");
	});

	it("keeps a field that the settings do not define after a save", () => {
		const form = { ...noteFormOf(NOTE, FIELDS), fields: { series: "React" } };
		expect(R.getExn(parseNoteForm(form, RULES)).fields).toEqual({
			legacyId: "old-1",
			series: "React",
		});
	});

	it("gives text for a stored value of another type", () => {
		const changed = { ...NOTE, fields: { featured: "yes", series: 3 } };
		expect(noteFormOf(changed, FIELDS).fields).toEqual({
			featured: false,
			readingTime: "",
			series: "3",
			relatedPosts: "",
		});
	});
});
