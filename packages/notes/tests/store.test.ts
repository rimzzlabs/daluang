import { O } from "@mobily/ts-belt";
import { describe, expect, it } from "vitest";
import type { NoteDraft } from "../src/note";
import {
	createNote,
	deleteNote,
	findNote,
	listNotes,
	setNoteStatus,
	updateNote,
} from "../src/store";
import { createFakeD1 } from "./fake-d1";

const FIRST = new Date("2026-10-18T00:00:00.000Z");
const LATER = new Date("2026-10-18T01:00:00.000Z");

const DRAFT: NoteDraft = {
	title: "Jotai recipes",
	slug: "jotai-recipes",
	language: "en",
	description: "Small patterns for Jotai.",
	keywords: ["jotai", "react"],
	fields: { featured: true, relatedPosts: ["jotai-state-manager"] },
	body: '# Jotai recipes\n\n::callout{type="note"}\nRead the docs first.\n::\n',
};

describe("createNote", () => {
	it("keeps a draft that findNote reads back", async () => {
		const { db } = createFakeD1();
		const note = await createNote({ db, draft: DRAFT, now: FIRST });
		expect(note).toEqual({
			...DRAFT,
			id: note.id,
			status: "draft",
			publishedAt: null,
			createdAt: FIRST.toISOString(),
			updatedAt: FIRST.toISOString(),
		});
		expect(await findNote({ db, id: note.id })).toEqual(note);
	});

	it("refuses a second note with the same slug and language", async () => {
		const { db } = createFakeD1();
		await createNote({ db, draft: DRAFT, now: FIRST });
		await expect(createNote({ db, draft: DRAFT, now: LATER })).rejects.toThrow(
			/UNIQUE/,
		);
	});

	it("keeps a translation: the same slug in another language", async () => {
		const { db } = createFakeD1();
		await createNote({ db, draft: DRAFT, now: FIRST });
		const translation = await createNote({
			db,
			draft: { ...DRAFT, language: "id", title: "Resep Jotai" },
			now: LATER,
		});
		expect(translation.language).toBe("id");
		expect(await listNotes(db)).toHaveLength(2);
	});
});

describe("listNotes", () => {
	it("gives a summary of each note, the last changed first", async () => {
		const { db } = createFakeD1();
		const first = await createNote({ db, draft: DRAFT, now: FIRST });
		const second = await createNote({
			db,
			draft: { ...DRAFT, slug: "jotai-state-manager" },
			now: LATER,
		});
		expect(await listNotes(db)).toEqual([
			{
				id: second.id,
				title: DRAFT.title,
				slug: "jotai-state-manager",
				language: "en",
				status: "draft",
				publishedAt: null,
				updatedAt: LATER.toISOString(),
			},
			{
				id: first.id,
				title: DRAFT.title,
				slug: DRAFT.slug,
				language: "en",
				status: "draft",
				publishedAt: null,
				updatedAt: FIRST.toISOString(),
			},
		]);
	});

	it("gives no notes for an empty table", async () => {
		const { db } = createFakeD1();
		expect(await listNotes(db)).toEqual([]);
	});
});

describe("findNote", () => {
	it("gives None for an ID that no note has", async () => {
		const { db } = createFakeD1();
		expect(O.isNone(await findNote({ db, id: "nope" }))).toBe(true);
	});

	it("gives None for a row whose JSON its schema refuses", async () => {
		const { db, database } = createFakeD1();
		const note = await createNote({ db, draft: DRAFT, now: FIRST });
		database
			.prepare('update "note" set "fields" = ?1 where "id" = ?2')
			.run("{not json", note.id);
		expect(O.isNone(await findNote({ db, id: note.id }))).toBe(true);
	});
});

describe("updateNote", () => {
	it("changes the draft and the time of the change, and keeps the rest", async () => {
		const { db } = createFakeD1();
		const note = await createNote({ db, draft: DRAFT, now: FIRST });
		const draft = { ...DRAFT, title: "More Jotai recipes", body: "# More" };
		expect(await updateNote({ db, id: note.id, draft, now: LATER })).toBe(true);
		expect(await findNote({ db, id: note.id })).toEqual({
			...note,
			...draft,
			updatedAt: LATER.toISOString(),
		});
	});

	it("gives false for an ID that no note has", async () => {
		const { db } = createFakeD1();
		expect(await updateNote({ db, id: "nope", draft: DRAFT, now: LATER })).toBe(
			false,
		);
	});

	it("refuses the slug that another note has in the same language", async () => {
		const { db } = createFakeD1();
		await createNote({ db, draft: DRAFT, now: FIRST });
		const other = await createNote({
			db,
			draft: { ...DRAFT, slug: "jotai-state-manager" },
			now: FIRST,
		});
		await expect(
			updateNote({ db, id: other.id, draft: DRAFT, now: LATER }),
		).rejects.toThrow(/UNIQUE/);
	});
});

describe("deleteNote", () => {
	it("deletes a note, then gives false for the same ID", async () => {
		const { db } = createFakeD1();
		const note = await createNote({ db, draft: DRAFT, now: FIRST });
		expect(await deleteNote({ db, id: note.id })).toBe(true);
		expect(O.isNone(await findNote({ db, id: note.id }))).toBe(true);
		expect(await deleteNote({ db, id: note.id })).toBe(false);
	});
});

describe("setNoteStatus", () => {
	it("sets publishedAt at the first publish, and keeps it after", async () => {
		const { db } = createFakeD1();
		const note = await createNote({ db, draft: DRAFT, now: FIRST });
		const ref = { db, id: note.id };
		expect(
			await setNoteStatus({ ...ref, status: "published", now: FIRST }),
		).toBe(true);
		await setNoteStatus({ ...ref, status: "draft", now: LATER });
		await setNoteStatus({ ...ref, status: "published", now: LATER });
		expect(await findNote(ref)).toEqual({
			...note,
			status: "published",
			publishedAt: FIRST.toISOString(),
		});
	});

	it("gives false for an ID that no note has", async () => {
		const { db } = createFakeD1();
		expect(
			await setNoteStatus({ db, id: "nope", status: "published", now: FIRST }),
		).toBe(false);
	});
});
