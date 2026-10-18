import { A, D, O, pipe } from "@mobily/ts-belt";
import { match } from "ts-pattern";
import type { Note, PublishedCopy } from "./note";

/** The path of the endpoint of the changes. */
export const CHANGES_API_PATH = "/api/changes";

/** The changes that wait for Publish changes. */
export const NOTE_CHANGES = ["publish", "edit", "unpublish", "delete"] as const;

export type NoteChange = (typeof NOTE_CHANGES)[number];

type CopyContent = Omit<PublishedCopy, "updatedAt">;

/** The content of a copy as JSON, with the extra fields in the order of their names. */
function contentText(copy: CopyContent): string {
	const fields = pipe(
		D.toPairs(copy.fields),
		A.sortBy(([name]) => name),
	);
	return JSON.stringify([
		copy.title,
		copy.slug,
		copy.language,
		copy.description,
		copy.keywords,
		fields,
		copy.body,
	]);
}

/** True when the working copy of a note has the content of its published copy. */
export function isPublishedCopy(note: Note): boolean {
	if (note.published === null) return false;
	return contentText(note) === contentText(note.published);
}

/**
 * The change of a note that waits for Publish changes, or `None`:
 * - `publish`: a note marked to publish, which the sites do not have yet
 * - `edit`: a published note whose working copy differs from its published copy
 * - `unpublish`: a published note marked to unpublish
 * - `delete`: a note marked to delete
 */
export function noteChange(note: Note): O.Option<NoteChange> {
	const live = note.published !== null;
	const edited = live && !isPublishedCopy(note);
	return match({ mark: note.mark, live, edited })
		.with({ mark: "delete" }, () => O.Some("delete" as const))
		.with({ mark: "unpublish", live: true }, () => O.Some("unpublish" as const))
		.with({ mark: "publish", live: false }, () => O.Some("publish" as const))
		.with({ edited: true }, () => O.Some("edit" as const))
		.otherwise(() => O.None);
}
