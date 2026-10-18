import { describe, expect, it } from "vitest";
import type { NoteSummary } from "../src/note";
import { listedNotes } from "../src/note-list";

function summary(id: string): NoteSummary {
	return {
		id,
		title: `Post ${id}`,
		slug: `post-${id}`,
		language: "en",
		status: "draft",
		publishedAt: null,
		updatedAt: "2026-10-18T12:00:00.000Z",
		mark: null,
	};
}

describe("listedNotes", () => {
	it("gives each note its change, in the order of the notes", () => {
		const notes = [summary("a"), summary("b"), summary("c")];
		const listed = listedNotes({
			notes,
			changes: [
				{ note: { id: "c" }, change: "delete" },
				{ note: { id: "a" }, change: "publish" },
			],
		});
		expect(listed).toEqual([
			{ note: notes[0], change: "publish" },
			{ note: notes[1], change: null },
			{ note: notes[2], change: "delete" },
		]);
	});

	it("drops a change of a note that is not on the list", () => {
		const notes = [summary("a")];
		expect(
			listedNotes({ notes, changes: [{ note: { id: "z" }, change: "edit" }] }),
		).toEqual([{ note: notes[0], change: null }]);
	});
});
