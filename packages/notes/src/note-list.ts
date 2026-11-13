import { A, O, pipe, S } from "@mobily/ts-belt";
import { match, P } from "ts-pattern";
import type { NoteChange } from "./change";
import type { NoteStatus } from "./metadata";
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

/** The status filter of the explorer of the editor: each note, or the notes of one status. */
export type ExplorerFilter = NoteStatus | "all";

export interface ExplorerQuery {
	/** The text of the search. An empty text finds each note. */
	search: string;
	filter: ExplorerFilter;
}

/**
 * The notes of the explorer: the notes of the filter whose title or slug holds the search
 * text, with no difference between capitals and small letters. The order stays.
 */
export function explorerNotes(
	listed: readonly ListedNote[],
	query: ExplorerQuery,
): readonly ListedNote[] {
	const search = pipe(query.search, S.trim, S.toLowerCase);
	return A.filter(listed, (item) => {
		const { note } = item;
		if (query.filter !== "all" && note.status !== query.filter) return false;
		return (
			S.includes(S.toLowerCase(note.title), search) ||
			S.includes(note.slug, search)
		);
	});
}

/**
 * The actions of `POST /api/notes/<id>/<action>`: a mark for Publish changes, or `cancel`,
 * which clears the mark.
 */
export const NOTE_MARK_ACTIONS = ["publish", "unpublish", "cancel"] as const;

export type NoteMarkAction = (typeof NOTE_MARK_ACTIONS)[number];

/** An action of the menu of a listed note: a mark, a cancel, or a delete. */
export type NoteAction = NoteMarkAction | "delete";

/**
 * The actions of a listed note. A note with a mark can cancel it. A draft can wait to
 * publish, and a published note can wait to unpublish. An edit has no mark. Each note can
 * be deleted, with the exception of a note that waits to delete.
 */
export function noteActions(listed: ListedNote): readonly NoteAction[] {
	return match(listed.change)
		.with("delete", () => ["cancel"] as const)
		.with(P.union("publish", "unpublish"), () => ["cancel", "delete"] as const)
		.with(P.union("edit", null), () => {
			const published = listed.note.status === "published";
			return [published ? "unpublish" : "publish", "delete"] as const;
		})
		.exhaustive();
}

/** The number of notes in one language. */
export interface LanguageCount {
	language: string;
	count: number;
}

/** The numbers of the notes of a CMS, for its dashboard. */
export interface NoteCounts {
	drafts: number;
	published: number;
	/** Each language of the CMS in its order, then each other language of a note. */
	languages: readonly LanguageCount[];
}

/** The number of drafts, of published notes, and of notes in each language. */
export function noteCounts(
	notes: readonly NoteSummary[],
	languages: readonly string[],
): NoteCounts {
	const tags = A.uniq([...languages, ...A.map(notes, (note) => note.language)]);
	return {
		drafts: A.length(A.filter(notes, (note) => note.status === "draft")),
		published: A.length(A.filter(notes, (note) => note.status === "published")),
		languages: A.map(tags, (language) => ({
			language,
			count: A.length(A.filter(notes, (note) => note.language === language)),
		})),
	};
}
