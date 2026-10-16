import { describe, expect, it } from "vitest";
import {
	isLanguageOfCms,
	languagesSettingSchema,
} from "../src/languages-setting";

describe("languagesSettingSchema", () => {
	it("accepts a list with its default language, in canonical form", () => {
		expect(
			languagesSettingSchema.parse({
				languages: ["EN", "id"],
				defaultLanguage: "en",
			}),
		).toEqual({ languages: ["en", "id"], defaultLanguage: "en" });
	});

	it("needs at least one language", () => {
		const result = languagesSettingSchema.safeParse({
			languages: [],
			defaultLanguage: "en",
		});
		expect(result.error?.issues.map((issue) => issue.message)).toContain(
			"Add at least one language.",
		);
	});

	it("refuses a language that is on the list two times", () => {
		const result = languagesSettingSchema.safeParse({
			languages: ["en", "EN"],
			defaultLanguage: "en",
		});
		expect(result.error?.issues[0]?.message).toBe(
			"Each language can be on the list one time only.",
		);
	});

	it("refuses a default language that is not on the list", () => {
		const result = languagesSettingSchema.safeParse({
			languages: ["en"],
			defaultLanguage: "id",
		});
		expect(result.error?.issues[0]?.path).toEqual(["defaultLanguage"]);
	});
});

describe("isLanguageOfCms", () => {
	const setting = { languages: ["en", "id"], defaultLanguage: "en" };

	it("is true for a language on the list", () => {
		expect(isLanguageOfCms({ language: "id", setting })).toBe(true);
	});

	it("is false for a language that is not on the list", () => {
		expect(isLanguageOfCms({ language: "fr", setting })).toBe(false);
	});
});
