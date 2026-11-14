import { O, R } from "@mobily/ts-belt";
import { describe, expect, it } from "vitest";
import {
	checkedImport,
	importFileOf,
	importMark,
	importRules,
} from "../src/import-draft";
import type { DraftRules } from "../src/note-draft";
import type { ImportedNote } from "../src/note-import";

const RULES: DraftRules = {
	languages: { languages: ["en", "id"], defaultLanguage: "en" },
	fields: [
		{ name: "featured", label: "Featured", type: "boolean", required: true },
	],
};

const IMPORTED: ImportedNote = {
	draft: {
		title: "Jotai Recipes",
		slug: "jotai-recipes",
		language: "en",
		description: "Derived atoms",
		keywords: ["react"],
		fields: { featured: true },
		body: '::callout{type="note"}\nUse atoms.\n::\n',
	},
	publishedAt: "2023-09-30T00:00:00.000Z",
	updatedAt: "2026-10-16T00:00:00.000Z",
	wantsPublish: true,
	warnings: [],
};

describe("importRules", () => {
	it("gives the languages and the fields of the settings", () => {
		expect(importRules({ languages: RULES.languages, fields: null })).toEqual(
			O.Some({ languages: RULES.languages, fields: [] }),
		);
	});

	it("gives None before the onboarding saves the languages", () => {
		expect(importRules({ languages: null, fields: [] })).toBe(O.None);
	});
});

describe("importFileOf", () => {
	it("gives the file of a body", () => {
		const file = { fileName: "a.md", language: "en", text: "# A" };
		expect(importFileOf(file)).toEqual(R.Ok(file));
	});

	it("gives the issues of a body that is not a file", () => {
		expect(importFileOf({ fileName: "a.md", language: "en" })).toEqual(
			R.Error([{ path: "text", message: expect.any(String) }]),
		);
	});
});

describe("checkedImport", () => {
	it("gives the note with the draft that the settings accept", () => {
		expect(checkedImport({ imported: IMPORTED, rules: RULES })).toEqual(
			R.Ok(IMPORTED),
		);
	});

	it("gives the issues of a language that the CMS does not have", () => {
		const imported = {
			...IMPORTED,
			draft: { ...IMPORTED.draft, language: "fr" },
		};
		expect(checkedImport({ imported, rules: RULES })).toEqual(
			R.Error([{ path: "language", message: expect.any(String) }]),
		);
	});
});

describe("importMark", () => {
	it("gives publish to a published file with no warning", () => {
		expect(importMark({ imported: IMPORTED, rules: RULES })).toBe("publish");
	});

	it("gives publish to a published file with no date", () => {
		const imported = { ...IMPORTED, publishedAt: null, updatedAt: null };
		expect(importMark({ imported, rules: RULES })).toBe("publish");
	});

	it.each<[string, Partial<ImportedNote>]>([
		["status draft", { wantsPublish: false }],
		[
			"a component that stays",
			{ warnings: [{ code: "component-kept", name: "Kbd", count: 1 }] },
		],
		[
			"a date that the import cannot read",
			{
				publishedAt: null,
				warnings: [{ code: "date-not-read", name: "publishedAt" }],
			},
		],
		[
			"a field that the import leaves out",
			{ warnings: [{ code: "field-left-out", name: "cover" }] },
		],
		[
			"a required field with no value",
			{ draft: { ...IMPORTED.draft, fields: {} } },
		],
	])("gives no mark to a file with %s", (_name, change) => {
		expect(
			importMark({ imported: { ...IMPORTED, ...change }, rules: RULES }),
		).toBe(null);
	});
});
