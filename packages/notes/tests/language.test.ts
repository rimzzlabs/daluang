import { describe, expect, it } from "vitest";
import {
	canonicalLanguage,
	languageName,
	languageTagSchema,
} from "../src/language";

describe("canonicalLanguage", () => {
	it("gives the canonical form of a tag", () => {
		expect(canonicalLanguage(" EN-us ")).toBe("en-US");
		expect(canonicalLanguage("id")).toBe("id");
		expect(canonicalLanguage("zh-hant-tw")).toBe("zh-Hant-TW");
	});

	it("gives None for a value that is not a tag", () => {
		expect(canonicalLanguage("not a tag")).toBeUndefined();
		expect(canonicalLanguage("")).toBeUndefined();
	});
});

describe("languageTagSchema", () => {
	it("accepts a tag and gives its canonical form", () => {
		expect(languageTagSchema.parse("pt-br")).toBe("pt-BR");
	});

	it("refuses a value that is not a tag, with an example in the message", () => {
		const result = languageTagSchema.safeParse("english please");
		expect(result.error?.issues[0]?.message).toContain("Use a tag such as en");
	});
});

describe("languageName", () => {
	it("names a language in the language of the interface", () => {
		expect(languageName({ tag: "id", displayIn: "en" })).toBe("Indonesian");
		expect(languageName({ tag: "en", displayIn: "id" })).toBe("Inggris");
	});

	it("keeps the tag when the interface language is not a tag", () => {
		expect(languageName({ tag: "id", displayIn: "not a tag" })).toBe("id");
	});
});
