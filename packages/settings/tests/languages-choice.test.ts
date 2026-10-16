import { R } from "@mobily/ts-belt";
import { describe, expect, it } from "vitest";
import {
	addLanguage,
	chooseLanguages,
	languageOptions,
} from "../src/languages-choice";

const CHOICE = { languages: ["en", "id"], defaultLanguage: "en" };

describe("chooseLanguages", () => {
	it("keeps the default language when it stays on the list", () => {
		expect(chooseLanguages(CHOICE, ["en", "id", "ja"])).toEqual({
			languages: ["en", "id", "ja"],
			defaultLanguage: "en",
		});
	});

	it("gives the default to the first language when the default leaves", () => {
		expect(chooseLanguages(CHOICE, ["id"])).toEqual({
			languages: ["id"],
			defaultLanguage: "id",
		});
	});

	it("keeps the last language", () => {
		expect(chooseLanguages(CHOICE, [])).toBe(CHOICE);
	});
});

describe("addLanguage", () => {
	it("adds the canonical form of a tag", () => {
		expect(addLanguage(CHOICE, "pt-br")).toEqual(
			R.Ok({ languages: ["en", "id", "pt-BR"], defaultLanguage: "en" }),
		);
	});

	it("keeps the choice for a language that is on the list", () => {
		expect(addLanguage(CHOICE, "ID")).toEqual(R.Ok(CHOICE));
	});

	it("refuses a word that is not a language", () => {
		expect(addLanguage(CHOICE, "english")).toEqual(R.Error("not-a-language"));
	});
});

describe("languageOptions", () => {
	it("gives the common languages, then each other chosen one", () => {
		expect(
			languageOptions({ common: ["en", "id"], chosen: ["id", "pt-BR"] }),
		).toEqual(["en", "id", "pt-BR"]);
	});
});
