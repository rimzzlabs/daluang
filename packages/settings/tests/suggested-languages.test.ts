import { describe, expect, it } from "vitest";
import { initialLanguages, suggestLanguages } from "../src/suggested-languages";

describe("suggestLanguages", () => {
	it("gives the main language of each tag, the language of the browser first", () => {
		expect(suggestLanguages("en-US,en;q=0.9,id;q=0.8")).toEqual(["en", "id"]);
	});

	it("orders the languages by weight", () => {
		expect(suggestLanguages("id;q=0.5,ja;q=0.9,ko")).toEqual([
			"ko",
			"ja",
			"id",
		]);
	});

	it("gives three languages or fewer", () => {
		expect(suggestLanguages("en,id,ja,ko")).toEqual(["en", "id", "ja"]);
	});

	it.each([
		["no header", null],
		["an empty header", ""],
		["a wildcard only", "*"],
		["a word that is not a language", "klingonish"],
		["a weight of zero", "id;q=0"],
		["a weight that is not a number", "id;q=high"],
	])("suggests English for %s", (_name, header) => {
		expect(suggestLanguages(header)).toEqual(["en"]);
	});
});

describe("initialLanguages", () => {
	it("gives the stored languages", () => {
		const stored = { languages: ["ja"], defaultLanguage: "ja" };
		expect(initialLanguages({ stored, acceptLanguage: "en" })).toBe(stored);
	});

	it("gives the suggestion of the browser, with its first language as the default", () => {
		expect(
			initialLanguages({ stored: null, acceptLanguage: "id,en;q=0.5" }),
		).toEqual({ languages: ["id", "en"], defaultLanguage: "id" });
	});
});
