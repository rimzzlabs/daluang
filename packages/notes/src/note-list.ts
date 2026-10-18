import { A, O, pipe } from "@mobily/ts-belt";
import { match, P } from "ts-pattern";
import type { NoteChange } from "./change";
import type { NoteSummary } from "./note";

/** A note of the list of the CMS, with the change that waits for Publish changes. */
export interface ListedNote {
	note: NoteSummary;
	/** `null` when the note has no change. */
	change: NoteChange | null;
}

/** A change of `GET /api/changes`: the note, by its ID, and its change. */
export interface ChangeOfNote {
	note: Pick<NoteSummary, "id">;
	change: NoteChange;
}

export interface ListedNotesParams {
	notes: readonly NoteSummary[];
	changes: readonly ChangeOfNote[];
}

/** Each note with its change, in the order of `notes`. A change of no listed note is lost. */
export function listedNotes(params: ListedNotesParams): readonly ListedNote[] {
	const { notes, changes } = params;
	return A.map(notes, (note) => ({
		note,
		change: pipe(
			changes,
			A.find((item) => item.note.id === note.id),
			O.map((item) => item.change),
			O.toNullable,
		),
	}));
}

/** The notes in one language, or each note when `language` is `null`. The order stays. */
export function inLanguage(
	listed: readonly ListedNote[],
	language: string | null,
): readonly ListedNote[] {
	if (language === null) return listed;
	return A.filter(listed, (item) => item.note.language === language);
}

/**
 * The actions of `POST /api/notes/<id>/<action>`: a mark for Publish changes, or `cancel`,
 * which clears the mark.
 */
export const NOTE_MARK_ACTIONS = ["publish", "unpublish", "cancel"] as const;

export type NoteMarkAction = (typeof NOTE_MARK_ACTIONS)[number];

/**
 * The actions of a listed note. A note with a mark can cancel it. A draft can wait to
 * publish, and a published note can wait to unpublish. An edit has no mark.
 */
export function noteActions(listed: ListedNote): readonly NoteMarkAction[] {
	return match(listed.change)
		.with(P.union("publish", "unpublish", "delete"), () => ["cancel"] as const)
		.with(P.union("edit", null), () => {
			const published = listed.note.status === "published";
			return [published ? "unpublish" : "publish"] as const;
		})
		.exhaustive();
}
