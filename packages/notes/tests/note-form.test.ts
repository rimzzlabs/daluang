import { R } from "@mobily/ts-belt";
import { describe, expect, it } from "vitest";
import type { FieldDefinition } from "../src/field-definitions";
import {
	emptyNoteForm,
	type NoteForm,
	noteFormOf,
	parseNoteForm,
	publishBlockers,
	unshownErrors,
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

function errorsOf(form: NoteForm): Record<string, string> {
	return R.match(
		parseNoteForm(form, RULES),
		() => ({}),
		(found) => found,
	);
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
			language:
				"This language is not in the settings of the CMS. Choose another language.",
			"fields.readingTime": "Reading time needs a number.",
		});
	});

	it("gives the error of a long keyword at the key of the keywords", () => {
		const form = { ...filled(), keywords: `react, ${"k".repeat(61)}` };
		expect(errorsOf(form)).toEqual({
			keywords: "Keep each keyword at 60 characters or fewer.",
		});
	});

	it("gives the error of a bad item of a list field at the key of the field", () => {
		const form = {
			...filled(),
			fields: { ...filled().fields, relatedPosts: `a, ${"x".repeat(201)}` },
		};
		expect(Object.keys(errorsOf(form))).toEqual(["fields.relatedPosts"]);
	});

	it("keeps a field name of digits in its key", () => {
		const form = { ...filled(), kept: { "123": "x" } };
		expect(Object.keys(errorsOf(form))).toEqual(["fields.123"]);
	});
});

describe("unshownErrors", () => {
	it("gives nothing for the key of each input", () => {
		const errors = {
			title: "a",
			slug: "b",
			language: "c",
			description: "d",
			keywords: "e",
			body: "f",
			"fields.series": "g",
		};
		expect(unshownErrors(errors, FIELDS)).toEqual([]);
	});

	it("gives the message of a key that no input shows", () => {
		const errors = {
			title: "a",
			"fields.mood": "Mood is not a field name.",
			fields: "A post can have 30 extra fields or fewer.",
		};
		expect(unshownErrors(errors, FIELDS)).toEqual([
			"mood: Mood is not a field name.",
			"A post can have 30 extra fields or fewer.",
		]);
	});

	it("names each kept field, so two fields with the same message show two lines", () => {
		const errors = { "fields.mood": "Too long.", "fields.tone": "Too long." };
		expect(unshownErrors(errors, FIELDS)).toEqual([
			"mood: Too long.",
			"tone: Too long.",
		]);
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

	it("lets the slug of an untitled draft follow the title", () => {
		const untitled = { ...NOTE, title: "Untitled 2", slug: "untitled-2" };
		const form = noteFormOf(untitled, FIELDS);
		expect(withTitle(form, "Resep Jotai").slug).toBe("resep-jotai");
	});

	it("keeps the slug of an untitled post that was published", () => {
		const published = {
			...NOTE,
			slug: "untitled",
			publishedAt: "2026-10-18T12:00:00.000Z",
		};
		expect(noteFormOf(published, FIELDS).slugTouched).toBe(true);
	});

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

describe("publishBlockers", () => {
	const REQUIRED_RULES = {
		...RULES,
		fields: [
			...FIELDS,
			{ name: "cover", label: "Cover", type: "list", required: true },
		] satisfies readonly FieldDefinition[],
	};
	const NOTE = {
		title: "Jotai recipes",
		slug: "jotai-recipes",
		language: "en",
		description: "Small recipes.",
		keywords: [],
		fields: { series: "Jotai", cover: ["a.png"] },
		body: "",
	};

	it("names each empty required field by its label", () => {
		const note = { ...NOTE, fields: { series: " ", cover: [] } };
		expect(publishBlockers(note, REQUIRED_RULES)).toEqual([
			{ label: "Series", message: "Give Series a value." },
			{ label: "Cover", message: "Give Cover a value." },
		]);
	});

	it("gives an empty list for a note that can go", () => {
		expect(publishBlockers(NOTE, REQUIRED_RULES)).toEqual([]);
	});

	it("names a core input by a fixed label", () => {
		const blockers = publishBlockers(
			{ ...NOTE, language: "fr" },
			REQUIRED_RULES,
		);
		expect(blockers.map((blocker) => blocker.label)).toEqual(["Language"]);
	});

	it("uses the name of a kept field that has no definition", () => {
		const note = {
			...NOTE,
			fields: { ...NOTE.fields, extra: Array.from({ length: 51 }, () => "a") },
		};
		expect(publishBlockers(note, REQUIRED_RULES).map((b) => b.label)).toEqual([
			"extra",
		]);
	});

	it("names the root key of the extra fields", () => {
		const many = Object.fromEntries(
			Array.from({ length: 31 }, (_, index) => [`f${index}`, "x"]),
		);
		const note = { ...NOTE, fields: { ...NOTE.fields, ...many } };
		expect(publishBlockers(note, REQUIRED_RULES).map((b) => b.label)).toEqual([
			"Extra fields",
		]);
	});

	it("gives one blocker for two bad keywords", () => {
		const note = { ...NOTE, keywords: ["", " "] };
		expect(publishBlockers(note, REQUIRED_RULES).map((b) => b.label)).toEqual([
			"Keywords",
		]);
	});

	it("names a field of the wrong type", () => {
		const note = { ...NOTE, fields: { ...NOTE.fields, readingTime: "long" } };
		expect(publishBlockers(note, REQUIRED_RULES)).toEqual([
			{ label: "Reading time", message: "Reading time needs a number." },
		]);
	});
});
