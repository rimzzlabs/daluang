import { describe, expect, it } from "vitest";
import { languageLabel } from "../src/language-label";

describe("languageLabel", () => {
	it.each([
		["en", "English"],
		["id", "Indonesia"],
		["es", "Español"],
		["ja", "日本語"],
		["su", "Basa Sunda"],
		["jv", "Basa Jawa"],
		["valueOf", "Valueof"],
	])("names %s as %s", (tag, label) => {
		expect(languageLabel(tag)).toBe(label);
	});
});
