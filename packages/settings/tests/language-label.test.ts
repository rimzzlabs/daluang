import { describe, expect, it } from "vitest";
import { languageLabel } from "../src/language-label";

describe("languageLabel", () => {
	it.each([
		["en", "English"],
		["id", "Indonesia"],
		["es", "Español"],
		["ja", "日本語"],
	])("names %s as %s", (tag, label) => {
		expect(languageLabel(tag)).toBe(label);
	});
});
