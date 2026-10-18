import { A, O, pipe } from "@mobily/ts-belt";
import { match, P } from "ts-pattern";
import { z } from "zod";
import { type NoteChange, noteChange } from "./change";
import { extraFieldsSchema } from "./extra-fields";
import { NOTE_STATUSES } from "./metadata";
import {
	NOTE_MARKS,
	type Note,
	type NoteDraft,
	type NoteMark,
	type NoteSummary,
	publishedCopySchema,
} from "./note";

const COLUMNS =
	'"id", "slug", "language", "title", "description", "keywords", "status", "publishedAt", "fields", "body", "createdAt", "updatedAt", "published", "mark"';

const SUMMARY_COLUMNS =
	'"id", "slug", "language", "title", "status", "publishedAt", "updatedAt", "mark"';

// The working copy of a note as the JSON of a published copy, in SQL.
const WORKING_COPY_JSON = `json_object('title', "title", 'slug', "slug", 'language', "language", 'description', "description", 'keywords', json("keywords"), 'fields', json("fields"), 'body', "body", 'updatedAt', "updatedAt")`;

/** A column of JSON text, read with the schema of its value. */
function jsonColumn<T>(schema: z.ZodType<T>) {
	return z
		.string()
		.transform((text) => O.fromExecution((): unknown => JSON.parse(text)))
		.pipe(schema);
}

const summaryRowSchema = z.object({
	id: z.string(),
	slug: z.string(),
	language: z.string(),
	title: z.string(),
	status: z.enum(NOTE_STATUSES),
	publishedAt: z.string().nullable(),
	updatedAt: z.string(),
	mark: z.enum(NOTE_MARKS).nullable(),
});

const noteRowSchema: z.ZodType<Note> = summaryRowSchema.extend({
	description: z.string(),
	keywords: jsonColumn(z.array(z.string())),
	fields: jsonColumn(extraFieldsSchema),
	body: z.string(),
	createdAt: z.string(),
	published: z.null().or(jsonColumn(publishedCopySchema)),
});

function parseRows<T>(
	rows: readonly unknown[],
	schema: z.ZodType<T>,
): readonly T[] {
	return A.filterMap(rows, (row) => O.fromNullable(schema.safeParse(row).data));
}

/**
 * Side effect: reads the table `note` of D1, because D1 keeps the notes.
 *
 * Each note, the last changed first. A summary has no body, so a long list stays small.
 */
export async function listNotes(
	db: D1Database,
): Promise<readonly NoteSummary[]> {
	const result = await db
		.prepare(`select ${SUMMARY_COLUMNS} from "note" order by "updatedAt" desc`)
		.all();
	return parseRows(result.results, summaryRowSchema);
}

/**
 * Side effect: reads the published notes of D1, because a site builds its pages from them.
 *
 * Each note that has a published copy, the last published first. A draft is not in the
 * list.
 */
export async function listPublishedNotes(
	db: D1Database,
): Promise<readonly Note[]> {
	const result = await db
		.prepare(
			`select ${COLUMNS} from "note" where "published" is not null order by "publishedAt" desc`,
		)
		.all();
	return parseRows(result.results, noteRowSchema);
}

export interface NoteRef {
	db: D1Database;
	id: string;
}

/**
 * Side effect: reads one row of the table `note` of D1.
 *
 * The note with this ID, or `None`. A row that its schema refuses is `None` also.
 */
export async function findNote(ref: NoteRef): Promise<O.Option<Note>> {
	const result = await ref.db
		.prepare(`select ${COLUMNS} from "note" where "id" = ?1`)
		.bind(ref.id)
		.all();
	return pipe(parseRows(result.results, noteRowSchema), A.head);
}

export interface NoteCreate {
	db: D1Database;
	draft: NoteDraft;
	now: Date;
}

/**
 * Side effect: writes a row with a random ID to D1. The note must stay after this request.
 *
 * Adds a note as a draft. D1 refuses a second note with the same slug and language: the
 * unique index is the last check, after the check of the endpoint.
 */
export async function createNote(create: NoteCreate): Promise<Note> {
	const at = create.now.toISOString();
	const note: Note = {
		...create.draft,
		id: crypto.randomUUID(),
		status: "draft",
		publishedAt: null,
		createdAt: at,
		updatedAt: at,
		published: null,
		mark: null,
	};
	await create.db
		.prepare(
			`insert into "note" (${COLUMNS}) values (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, null, null)`,
		)
		.bind(
			note.id,
			note.slug,
			note.language,
			note.title,
			note.description,
			JSON.stringify(note.keywords),
			note.status,
			note.publishedAt,
			JSON.stringify(note.fields),
			note.body,
			note.createdAt,
			note.updatedAt,
		)
		.run();
	return note;
}

export interface NoteUpdate {
	db: D1Database;
	id: string;
	draft: NoteDraft;
	now: Date;
}

/**
 * Side effect: writes the draft over a row of D1, so that the change stays after this
 * request.
 *
 * Changes the text and the metadata of a note. The status and the dates of the publish
 * and of the first save stay. False when no note has the ID.
 */
export async function updateNote(update: NoteUpdate): Promise<boolean> {
	const { draft } = update;
	const result = await update.db
		.prepare(
			'update "note" set "slug" = ?2, "language" = ?3, "title" = ?4, "description" = ?5, "keywords" = ?6, "fields" = ?7, "body" = ?8, "updatedAt" = ?9 where "id" = ?1',
		)
		.bind(
			update.id,
			draft.slug,
			draft.language,
			draft.title,
			draft.description,
			JSON.stringify(draft.keywords),
			JSON.stringify(draft.fields),
			draft.body,
			update.now.toISOString(),
		)
		.run();
	return result.meta.changes > 0;
}

export interface NoteMarking {
	db: D1Database;
	id: string;
	mark: NoteMark | null;
}

/**
 * Side effect: writes the mark of a note to D1, so that Publish changes finds it.
 *
 * Marks a note to publish, to unpublish, or to delete, or clears its mark. False when no
 * note has the ID.
 */
export async function markNote(marking: NoteMarking): Promise<boolean> {
	const result = await marking.db
		.prepare('update "note" set "mark" = ?2 where "id" = ?1')
		.bind(marking.id, marking.mark)
		.run();
	return result.meta.changes > 0;
}

/**
 * Side effect: deletes a row from D1, because a deleted note must not come back.
 *
 * Deletes a note. False when no note has the ID.
 */
export async function deleteNote(ref: NoteRef): Promise<boolean> {
	const result = await ref.db
		.prepare('delete from "note" where "id" = ?1')
		.bind(ref.id)
		.run();
	return result.meta.changes > 0;
}

/** A note with a change that waits for Publish changes. */
export interface PendingChange {
	note: NoteSummary;
	change: NoteChange;
}

function summaryOf(note: Note): NoteSummary {
	return {
		id: note.id,
		title: note.title,
		slug: note.slug,
		language: note.language,
		status: note.status,
		publishedAt: note.publishedAt,
		updatedAt: note.updatedAt,
		mark: note.mark,
	};
}

/**
 * Side effect: reads each note of D1, because only D1 knows which notes changed.
 *
 * Each note with a change that waits for Publish changes, the last changed first.
 */
export async function listChanges(
	db: D1Database,
): Promise<readonly PendingChange[]> {
	const result = await db
		.prepare(`select ${COLUMNS} from "note" order by "updatedAt" desc`)
		.all();
	return pipe(
		parseRows(result.results, noteRowSchema),
		A.filterMap((note) =>
			O.map(noteChange(note), (change) => ({ note: summaryOf(note), change })),
		),
	);
}

const PUBLISH_SQL = `update "note" set "status" = 'published', "publishedAt" = coalesce("publishedAt", ?2), "published" = ${WORKING_COPY_JSON}, "mark" = null where "id" = ?1`;

const UNPUBLISH_SQL = `update "note" set "status" = 'draft', "published" = null, "mark" = null where "id" = ?1`;

interface ChangeWrite {
	db: D1Database;
	pending: PendingChange;
	at: string;
}

function changeStatement(write: ChangeWrite): D1PreparedStatement {
	const { db, pending, at } = write;
	return match(pending.change)
		.with(P.union("publish", "edit"), () =>
			db.prepare(PUBLISH_SQL).bind(pending.note.id, at),
		)
		.with("unpublish", () => db.prepare(UNPUBLISH_SQL).bind(pending.note.id))
		.with("delete", () =>
			db.prepare('delete from "note" where "id" = ?1').bind(pending.note.id),
		)
		.exhaustive();
}

export interface ChangesApply {
	db: D1Database;
	now: Date;
}

/**
 * Side effect: writes each change to D1 in one batch, which is one transaction. The sites
 * then read the new published copies at their next build.
 *
 * Applies each change. A publish and an edit copy the working copy to the published copy,
 * an unpublish clears the published copy, and a delete removes the note. Each one clears
 * the mark, and the first publish sets `publishedAt`. Gives the applied changes.
 */
export async function applyChanges(
	apply: ChangesApply,
): Promise<readonly PendingChange[]> {
	const pending = await listChanges(apply.db);
	if (A.isEmpty(pending)) return pending;
	const at = apply.now.toISOString();
	await apply.db.batch([
		...A.map(pending, (item) =>
			changeStatement({ db: apply.db, pending: item, at }),
		),
	]);
	return pending;
}
