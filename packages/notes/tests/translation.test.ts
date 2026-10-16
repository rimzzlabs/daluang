import { describe, expect, it } from "vitest";
import { isSlugTaken, translationsOf } from "../src/translation";

const notes = [
	{ id: "1", slug: "lefthook", language: "en" },
	{ id: "2", slug: "lefthook", language: "id" },
	{ id: "3", slug: "husky", language: "en" },
];

describe("translationsOf", () => {
	it("gives the notes with the same slug in another language", () => {
		expect(
			translationsOf({ note: { slug: "lefthook", language: "en" }, notes }),
		).toEqual([notes[1]]);
	});

	it("gives no notes when the note has no translation", () => {
		expect(
			translationsOf({ note: { slug: "husky", language: "en" }, notes }),
		).toEqual([]);
	});
});

describe("isSlugTaken", () => {
	it("is true for a slug that the language already has", () => {
		expect(
			isSlugTaken({ note: { slug: "lefthook", language: "id" }, notes }),
		).toBe(true);
	});

	it("is false for the same slug in a new language", () => {
		expect(
			isSlugTaken({ note: { slug: "husky", language: "id" }, notes }),
		).toBe(false);
	});
});
