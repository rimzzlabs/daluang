import { describe, expect, it } from "vitest";
import { noteSchema, noteSummarySchema } from "../src/note";

const NOTE = {
	id: "n1",
	title: "Jotai recipes",
	slug: "jotai-recipes",
	language: "en",
	description: "",
	keywords: ["jotai"],
	status: "draft",
	publishedAt: null,
	updatedAt: "2026-10-18T00:00:00.000Z",
	createdAt: "2026-10-18T00:00:00.000Z",
	fields: { featured: true, related: ["a"] },
	body: "# Jotai",
};

describe("noteSchema", () => {
	it("reads a note of an answer, and refuses an unknown status", () => {
		expect(noteSchema.parse(NOTE)).toEqual(NOTE);
		expect(noteSchema.safeParse({ ...NOTE, status: "gone" }).success).toBe(
			false,
		);
	});
});

describe("noteSummarySchema", () => {
	it("keeps only the fields of a summary", () => {
		expect(noteSummarySchema.parse(NOTE)).toEqual({
			id: "n1",
			title: "Jotai recipes",
			slug: "jotai-recipes",
			language: "en",
			status: "draft",
			publishedAt: null,
			updatedAt: "2026-10-18T00:00:00.000Z",
		});
	});
});
