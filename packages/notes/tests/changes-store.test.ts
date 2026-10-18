import { A, O, pipe } from "@mobily/ts-belt";
import { describe, expect, it } from "vitest";
import type { NoteDraft } from "../src/note";
import {
	applyChanges,
	createNote,
	findNote,
	listChanges,
	markNote,
	updateNote,
} from "../src/store";
import { createFakeD1 } from "./fake-d1";
import { publishNotes } from "./publish";

const FIRST = new Date("2026-10-18T00:00:00.000Z");
const LATER = new Date("2026-10-18T01:00:00.000Z");

const DRAFT: NoteDraft = {
	title: "Jotai recipes",
	slug: "jotai-recipes",
	language: "en",
	description: "",
	keywords: [],
	fields: {},
	body: "# Jotai",
};

/** A database with one note of each change, and one note with no change. */
async function fourChanges() {
	const { db } = createFakeD1();
	const add = (slug: string) =>
		createNote({ db, draft: { ...DRAFT, slug }, now: FIRST });
	const [toPublish, edited, toUnpublish, toDelete, quiet] = await Promise.all([
		add("to-publish"),
		add("edited"),
		add("to-unpublish"),
		add("to-delete"),
		add("quiet"),
	]);
	await publishNotes({
		db,
		ids: A.map([edited, toUnpublish, toDelete, quiet], (note) => note.id),
		now: FIRST,
	});
	await markNote({ db, id: toPublish.id, mark: "publish" });
	await updateNote({
		db,
		id: edited.id,
		draft: { ...DRAFT, slug: "edited", body: "# More" },
		now: LATER,
	});
	await markNote({ db, id: toUnpublish.id, mark: "unpublish" });
	await markNote({ db, id: toDelete.id, mark: "delete" });
	return { db, toPublish, edited, toUnpublish, toDelete, quiet };
}

describe("listChanges", () => {
	it("gives each note with a change, the last changed first", async () => {
		const { db, edited } = await fourChanges();
		const changes = await listChanges(db);
		expect(A.map(changes, (item) => [item.note.slug, item.change])).toEqual([
			["edited", "edit"],
			expect.anything(),
			expect.anything(),
			expect.anything(),
		]);
		expect(changes[0]?.note).toEqual(
			expect.objectContaining({ id: edited.id, mark: null }),
		);
		expect(
			pipe(
				changes,
				A.map((item) => item.change),
				A.sort((a, b) => a.localeCompare(b)),
			),
		).toEqual(["delete", "edit", "publish", "unpublish"]);
	});

	it("gives no changes when each copy is current", async () => {
		const { db } = createFakeD1();
		const note = await createNote({ db, draft: DRAFT, now: FIRST });
		await publishNotes({ db, ids: [note.id], now: FIRST });
		expect(await listChanges(db)).toEqual([]);
	});
});

describe("applyChanges", () => {
	it("keeps the first publishedAt after an unpublish and a new publish", async () => {
		const { db } = createFakeD1();
		const note = await createNote({ db, draft: DRAFT, now: FIRST });
		const ref = { db, id: note.id };
		await publishNotes({ db, ids: [note.id], now: FIRST });
		await markNote({ ...ref, mark: "unpublish" });
		await applyChanges({ db, now: LATER });
		expect(O.getExn(await findNote(ref)).published).toBeNull();
		await publishNotes({ db, ids: [note.id], now: LATER });
		expect(O.getExn(await findNote(ref)).publishedAt).toBe(FIRST.toISOString());
	});

	it("applies each change in one batch, and leaves no change", async () => {
		const notes = await fourChanges();
		const { db } = notes;
		const applied = await applyChanges({ db, now: LATER });
		expect(applied).toHaveLength(4);
		expect(await listChanges(db)).toEqual([]);

		const published = O.getExn(await findNote({ db, id: notes.toPublish.id }));
		expect(published.status).toBe("published");
		expect(published.publishedAt).toBe(LATER.toISOString());
		expect(published.published?.slug).toBe("to-publish");
		expect(published.mark).toBeNull();

		const edited = O.getExn(await findNote({ db, id: notes.edited.id }));
		expect(edited.published?.body).toBe("# More");
		expect(edited.publishedAt).toBe(FIRST.toISOString());

		const unpublished = O.getExn(
			await findNote({ db, id: notes.toUnpublish.id }),
		);
		expect(unpublished.status).toBe("draft");
		expect(unpublished.published).toBeNull();

		expect(O.isNone(await findNote({ db, id: notes.toDelete.id }))).toBe(true);
		const quiet = O.getExn(await findNote({ db, id: notes.quiet.id }));
		expect(quiet.published?.body).toBe("# Jotai");
	});

	it("writes nothing when no change waits", async () => {
		const { db } = createFakeD1();
		expect(await applyChanges({ db, now: LATER })).toEqual([]);
	});
});
