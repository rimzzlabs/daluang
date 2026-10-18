import { A, O, pipe, R, S } from "@mobily/ts-belt";
import { match } from "ts-pattern";
import type { z } from "zod";
import type { FieldDefinition } from "./field-definitions";
import type { LanguagesSetting } from "./languages-setting";
import type { NoteDraft } from "./note";
import { NOTE_BODY_MAX_BYTES, noteDraftSchema } from "./note-draft";
import { createNote, listNotes } from "./store";
import { isSlugTaken } from "./translation";

export const NOTES_API_PATH = "/api/notes";

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
	settings: NoteSettings;
	/** The clock. The route file gives `() => new Date()`, and a test gives a fixed time. */
	now: () => Date;
}

interface NoteWrite extends NotesRequest {
	draft: NoteDraft;
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
 * True when a note has the slug of the draft in its language.
 */
async function isSlugInUse(write: NoteWrite): Promise<boolean> {
	return isSlugTaken({ note: write.draft, notes: await listNotes(write.db) });
}

/** Side effect: writes a new note to D1, so that the draft stays after this request. */
async function createFrom(write: NoteWrite): Promise<Response> {
	if (await isSlugInUse(write)) return errorResponse("slug-taken", 409);
	const note = await createNote({
		db: write.db,
		draft: write.draft,
		now: write.now(),
	});
	return Response.json({ note }, { status: 201 });
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
 * draft. The sign-in guard checks the session and the origin before this handler runs.
 */
export function handleNotesRequest(params: NotesRequest): Promise<Response> {
	return match(params.request.method)
		.with("GET", async () =>
			Response.json({ notes: await listNotes(params.db) }),
		)
		.with("POST", () =>
			writeDraft(params, (draft) => createFrom({ ...params, draft })),
		)
		.otherwise(() => notAllowed("GET, POST"));
}
