import { applyChanges, markNote } from "../src/store";

export interface PublishNotes {
	db: D1Database;
	ids: readonly string[];
	now: Date;
}

/** Publishes notes as Publish changes does: a mark on each note, then one batch. */
export async function publishNotes(publish: PublishNotes): Promise<void> {
	for (const id of publish.ids)
		await markNote({ db: publish.db, id, mark: "publish" });
	await applyChanges({ db: publish.db, now: publish.now });
}
