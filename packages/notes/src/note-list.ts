import { A, O, pipe } from "@mobily/ts-belt";
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
