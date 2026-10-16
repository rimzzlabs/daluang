import { describe, expect, it } from "vitest";
import { SLUG_MAX_LENGTH, slugify, slugSchema } from "../src/slug";

describe("slugify", () => {
	it("makes a lowercase slug with a hyphen between words", () => {
		expect(slugify("Git Hooks with Lefthook, Commitlint & Biome")).toBe(
			"git-hooks-with-lefthook-commitlint-biome",
		);
	});

	it("removes accents", () => {
		expect(slugify("Crème brûlée à la façon")).toBe("creme-brulee-a-la-facon");
	});

	it("gives an empty slug for a title with no letter or digit", () => {
		expect(slugify("¿¡ !?")).toBe("");
	});

	it("keeps the slug at the maximum length with no hyphen at the end", () => {
		const slug = slugify(`${"a".repeat(SLUG_MAX_LENGTH - 1)} b`);
		expect(slug.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
		expect(slug.endsWith("-")).toBe(false);
	});
});

describe("slugSchema", () => {
	it("accepts lowercase words with single hyphens", () => {
		expect(slugSchema.safeParse("my-first-note-2").success).toBe(true);
	});

	it.each([["My-Note"], ["my--note"], ["-note"], ["note-"], ["my note"], [""]])(
		"refuses %s",
		(value) => {
			expect(slugSchema.safeParse(value).success).toBe(false);
		},
	);

	it("refuses a slug that is too long", () => {
		expect(slugSchema.safeParse("a".repeat(SLUG_MAX_LENGTH + 1)).success).toBe(
			false,
		);
	});
});
