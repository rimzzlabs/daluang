import { A, O, pipe } from "@mobily/ts-belt";
import { z } from "zod";
import { extraFieldsSchema } from "./extra-fields";
import { NOTE_STATUSES, type NoteStatus } from "./metadata";
import type { Note, NoteDraft, NoteSummary } from "./note";

const COLUMNS =
	'"id", "slug", "language", "title", "description", "keywords", "status", "publishedAt", "fields", "body", "createdAt", "updatedAt"';

const SUMMARY_COLUMNS =
	'"id", "slug", "language", "title", "status", "publishedAt", "updatedAt"';

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
});

const noteRowSchema: z.ZodType<Note> = summaryRowSchema.extend({
	description: z.string(),
	keywords: jsonColumn(z.array(z.string())),
	fields: jsonColumn(extraFieldsSchema),
	body: z.string(),
	createdAt: z.string(),
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
	};
	await create.db
		.prepare(
			`insert into "note" (${COLUMNS}) values (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`,
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

export interface NoteStatusChange {
	db: D1Database;
	id: string;
	status: NoteStatus;
	now: Date;
}

/**
 * Side effect: writes the status of a note to D1, so that each site reads it at its next
 * build.
 *
 * Publishes a note, or takes it back to a draft. The first publish sets `publishedAt`, and
 * a later publish keeps it. A draft keeps it also. False when no note has the ID.
 */
export async function setNoteStatus(
	change: NoteStatusChange,
): Promise<boolean> {
	const result = await change.db
		.prepare(
			`update "note" set "status" = ?2, "publishedAt" = case when ?2 = 'published' then coalesce("publishedAt", ?3) else "publishedAt" end where "id" = ?1`,
		)
		.bind(change.id, change.status, change.now.toISOString())
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
