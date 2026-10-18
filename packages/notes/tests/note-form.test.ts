import { R } from "@mobily/ts-belt";
import { describe, expect, it } from "vitest";
import type { FieldDefinition } from "../src/field-definitions";
import {
	emptyNoteForm,
	type NoteForm,
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
