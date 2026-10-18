import { A, O, pipe, R, S } from "@mobily/ts-belt";
import { match, P } from "ts-pattern";
import type { z } from "zod";
import type { FieldDefinition } from "./field-definitions";
import type { LanguagesSetting } from "./languages-setting";
import type { NoteDraft } from "./note";
import { NOTE_BODY_MAX_BYTES, noteDraftSchema } from "./note-draft";
import {
	createNote,
	deleteNote,
	findNote,
	listNotes,
	markNote,
	type NoteRef,
	updateNote,
} from "./store";
import { isSlugTaken } from "./translation";

// The JSON of a draft holds its body and its metadata. The metadata is far below 64 KB.
const REQUEST_MAX_BYTES = NOTE_BODY_MAX_BYTES + 64 * 1024;

/** The error codes of the endpoint. The browser shows one message for each code. */
export type NotesApiError =
	| "method-not-allowed"
	| "not-found"
	| "not-json"
	| "too-large"
	| "invalid-note"
	| "slug-taken"
	| "settings-needed";

/** A refused value of a draft: the path of the field, and the message for the writer. */
export interface NoteIssue {
	path: string;
	message: string;
}

/**
 * The settings that a draft must obey. The route file gives the stored settings: the
 * languages are `null` until the onboarding saves them, and no fields are `null`.
 */
export interface NoteSettings {
	languages: LanguagesSetting | null;
	fields: readonly FieldDefinition[] | null;
}

export interface NotesRequest {
	request: Request;
	db: D1Database;
	/** The ID of `/api/notes/<id>`, or `undefined` for `/api/notes`. */
	id: string | undefined;
	/** The action of `/api/notes/<id>/<action>`, or `undefined` for the other paths. */
	action: string | undefined;
	settings: NoteSettings;
	/** The clock. The route file gives `() => new Date()`, and a test gives a fixed time. */
	now: () => Date;
}

interface NoteAction extends NotesRequest {
	id: string;
}

interface NoteWrite extends NotesRequest {
	draft: NoteDraft;
}

interface NoteChange extends NoteWrite {
	id: string;
}

function errorResponse(error: NotesApiError, status: number): Response {
	return Response.json({ error }, { status });
}

function toIssues(error: z.ZodError): readonly NoteIssue[] {
	return A.map(error.issues, (issue) => ({
		path: pipe(issue.path, A.map(String), A.join(".")),
		message: issue.message,
	}));
}

/** The draft of a request, or the response that refuses it. */
async function readDraft(
	params: NotesRequest,
): Promise<R.Result<NoteDraft, Response>> {
	const { request, settings } = params;
	if (settings.languages === null)
		return R.Error(errorResponse("settings-needed", 409));
	if (
		!S.startsWith(request.headers.get("content-type") ?? "", "application/json")
	)
		return R.Error(errorResponse("not-json", 415));
	const text = await request.text();
	if (new TextEncoder().encode(text).length > REQUEST_MAX_BYTES)
		return R.Error(errorResponse("too-large", 413));
	const body = O.fromExecution((): unknown => JSON.parse(text));
	if (O.isNone(body)) return R.Error(errorResponse("not-json", 400));
	const parsed = noteDraftSchema({
		languages: settings.languages,
		fields: settings.fields ?? [],
	}).safeParse(body);
	if (!parsed.success)
		return R.Error(
			Response.json(
				{ error: "invalid-note", issues: toIssues(parsed.error) },
				{ status: 422 },
			),
		);
	return R.Ok(parsed.data);
}

/**
 * Side effect: reads the notes of D1. Only D1 knows which slugs exist.
 *
 * True when a note other than `id` has the slug of the draft in its language.
 */
async function isSlugTakenByOther(write: NoteWrite): Promise<boolean> {
	const notes = await listNotes(write.db);
	return isSlugTaken({
		note: write.draft,
		notes: A.reject(notes, (note) => note.id === write.id),
	});
}

/** Side effect: writes a new note to D1, so that the draft stays after this request. */
async function createFrom(write: NoteWrite): Promise<Response> {
	if (await isSlugTakenByOther(write)) return errorResponse("slug-taken", 409);
	const note = await createNote({
		db: write.db,
		draft: write.draft,
		now: write.now(),
	});
	return Response.json({ note }, { status: 201 });
}

/** Side effect: writes a draft over a note of D1, so that the change stays. */
async function updateFrom(write: NoteChange): Promise<Response> {
	if (await isSlugTakenByOther(write)) return errorResponse("slug-taken", 409);
	const updated = await updateNote({
		db: write.db,
		id: write.id,
		draft: write.draft,
		now: write.now(),
	});
	if (!updated) return errorResponse("not-found", 404);
	return getNote({ db: write.db, id: write.id });
}

/** Side effect: reads one note of D1. */
async function getNote(ref: NoteRef): Promise<Response> {
	return pipe(
		await findNote(ref),
		O.match(
			(note) => Response.json({ note }),
			() => errorResponse("not-found", 404),
		),
	);
}

/** Side effect: writes D1 when the draft of the request is valid. */
async function writeDraft(
	params: NotesRequest,
	write: (draft: NoteDraft) => Promise<Response>,
): Promise<Response> {
	return R.match(await readDraft(params), write, (refused) =>
		Promise.resolve(refused),
	);
}

/**
 * Side effect: writes the mark of a note to D1, so that Publish changes finds it.
 *
 * Checks the note again first: a field can be required since its last save. A note that
 * the sites do not have gets the mark `publish`. A published note loses its mark, so an
 * unpublish or a delete that waits stops. An edit of it is a change with no mark.
 */
async function publishFrom(action: NoteAction): Promise<Response> {
	const found = await findNote({ db: action.db, id: action.id });
	if (O.isNone(found)) return errorResponse("not-found", 404);
	const { languages } = action.settings;
	if (languages === null) return errorResponse("settings-needed", 409);
	const checked = noteDraftSchema({
		languages,
		fields: action.settings.fields ?? [],
	}).safeParse(found);
	if (!checked.success)
		return Response.json(
			{ error: "invalid-note", issues: toIssues(checked.error) },
			{ status: 422 },
		);
	const mark = found.published === null ? "publish" : null;
	await markNote({ db: action.db, id: action.id, mark });
	return getNote({ db: action.db, id: action.id });
}

/**
 * Side effect: writes the mark of a note to D1, so that Publish changes finds it.
 *
 * Marks a published note to unpublish. For a note that the sites do not have, it clears
 * the mark: a publish that waits stops.
 */
async function unpublishFrom(action: NoteAction): Promise<Response> {
	const found = await findNote({ db: action.db, id: action.id });
	if (O.isNone(found)) return errorResponse("not-found", 404);
	const mark = found.published === null ? null : "unpublish";
	await markNote({ db: action.db, id: action.id, mark });
	return getNote({ db: action.db, id: action.id });
}

/** Side effect: clears the mark of a note in D1, so that its change stops waiting. */
async function cancelFrom(action: NoteAction): Promise<Response> {
	const cleared = await markNote({ db: action.db, id: action.id, mark: null });
	if (!cleared) return errorResponse("not-found", 404);
	return getNote({ db: action.db, id: action.id });
}

/**
 * Side effect: deletes a draft from D1 at once, or marks a published note to delete. The
 * sites keep a published note until the next Publish changes.
 */
async function deleteFrom(action: NoteAction): Promise<Response> {
	const found = await findNote({ db: action.db, id: action.id });
	if (O.isNone(found)) return errorResponse("not-found", 404);
	if (found.published !== null) {
		await markNote({ db: action.db, id: action.id, mark: "delete" });
		return getNote({ db: action.db, id: action.id });
	}
	await deleteNote({ db: action.db, id: action.id });
	return new Response(null, { status: 204 });
}

function notAllowed(allow: string): Promise<Response> {
	return Promise.resolve(
		Response.json(
			{ error: "method-not-allowed" },
			{ status: 405, headers: { Allow: allow } },
		),
	);
}

/**
 * Side effect: reads and writes the table `note` of D1, because D1 keeps the notes of the
 * CMS.
 *
 * The endpoint of the notes. `GET /api/notes` lists them, and `POST /api/notes` adds a
 * draft. `GET`, `PATCH`, and `DELETE /api/notes/<id>` read, change, and delete one note:
 * a delete of a published note only marks it. `POST /api/notes/<id>/publish`, `/unpublish`,
 * and `/cancel` mark a note, or clear its mark, for Publish changes. The sign-in guard
 * checks the session and the origin before this handler runs.
 */
export function handleNotesRequest(params: NotesRequest): Promise<Response> {
	const { request, db, id } = params;
	return match({ method: request.method, id, action: params.action })
		.with({ method: "POST", id: P.string, action: "publish" }, (route) =>
			publishFrom({ ...params, id: route.id }),
		)
		.with({ method: "POST", id: P.string, action: "unpublish" }, (route) =>
			unpublishFrom({ ...params, id: route.id }),
		)
		.with({ method: "POST", id: P.string, action: "cancel" }, (route) =>
			cancelFrom({ ...params, id: route.id }),
		)
		.with({ action: P.union("publish", "unpublish", "cancel") }, () =>
			notAllowed("POST"),
		)
		.with({ action: P.string }, () =>
			Promise.resolve(errorResponse("not-found", 404)),
		)
		.with({ method: "GET", id: undefined }, async () =>
			Response.json({ notes: await listNotes(db) }),
		)
		.with({ method: "POST", id: undefined }, () =>
			writeDraft(params, (draft) => createFrom({ ...params, draft })),
		)
		.with({ id: undefined }, () => notAllowed("GET, POST"))
		.with({ method: "GET", id: P.string }, (route) =>
			getNote({ db, id: route.id }),
		)
		.with({ method: "PATCH", id: P.string }, (route) =>
			writeDraft(params, (draft) =>
				updateFrom({ ...params, id: route.id, draft }),
			),
		)
		.with({ method: "DELETE", id: P.string }, (route) =>
			deleteFrom({ ...params, id: route.id }),
		)
		.with({ id: P.string }, () => notAllowed("GET, PATCH, DELETE"))
		.exhaustive();
}
