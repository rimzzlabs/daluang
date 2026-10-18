import { O } from "@mobily/ts-belt";
import { describe, expect, it } from "vitest";
import { isPublishedCopy, noteChange } from "../src/change";
import type { Note } from "../src/note";

const COPY = {
	title: "Jotai recipes",
	slug: "jotai-recipes",
	language: "en",
	description: "",
	keywords: ["jotai"],
	fields: { featured: true, series: "state" },
	body: "# Jotai",
	updatedAt: "2026-10-18T00:00:00.000Z",
};

const DRAFT: Note = {
	...COPY,
	id: "n1",
	status: "draft",
	publishedAt: null,
	createdAt: "2026-10-18T00:00:00.000Z",
	published: null,
	mark: null,
};

const LIVE: Note = {
	...DRAFT,
	status: "published",
	publishedAt: "2026-10-18T00:00:00.000Z",
	published: COPY,
};

describe("noteChange", () => {
	it.each([
		["a draft with no mark", DRAFT, O.None],
		[
			"a draft marked to publish",
			{ ...DRAFT, mark: "publish" },
			O.Some("publish"),
		],
		["a draft marked to unpublish", { ...DRAFT, mark: "unpublish" }, O.None],
		[
			"a draft marked to delete",
			{ ...DRAFT, mark: "delete" },
			O.Some("delete"),
		],
		["a live note with no edit", LIVE, O.None],
		["a live note with an edit", { ...LIVE, body: "# More" }, O.Some("edit")],
		[
			"a live note with an edit, marked to publish",
			{ ...LIVE, body: "# More", mark: "publish" },
			O.Some("edit"),
		],
		[
			"a live note with no edit, marked to publish",
			{ ...LIVE, mark: "publish" },
			O.None,
		],
		[
			"a live note marked to unpublish",
			{ ...LIVE, mark: "unpublish" },
			O.Some("unpublish"),
		],
		[
			"a live note marked to delete",
			{ ...LIVE, mark: "delete" },
			O.Some("delete"),
		],
	] as const)("gives the change of %s", (_name, note, change) => {
		expect(noteChange(note)).toEqual(change);
	});
});

describe("isPublishedCopy", () => {
	it("compares the content only, not the time of the edit", () => {
		expect(
			isPublishedCopy({ ...LIVE, updatedAt: "2026-10-19T00:00:00.000Z" }),
		).toBe(true);
	});

	it("does not depend on the order of the extra fields", () => {
		const fields = { series: "state", featured: true };
		expect(isPublishedCopy({ ...LIVE, fields })).toBe(true);
	});

	it("is false for a note with no published copy", () => {
		expect(isPublishedCopy(DRAFT)).toBe(false);
	});
});
