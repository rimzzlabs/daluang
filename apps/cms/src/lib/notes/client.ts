import type { NoteIssue } from "@daluang/notes/api";
import {
	CHANGES_API_PATH,
	NOTE_CHANGES,
	type NoteChange,
} from "@daluang/notes/change";
import {
	NOTES_API_PATH,
	type Note,
	type NoteDraft,
	type NoteSummary,
	noteSchema,
	noteSummarySchema,
} from "@daluang/notes/note";
import type {
	ImportError,
	ImportFile,
	ImportWarning,
} from "@daluang/notes/note-import";
import {
	type ListedNote,
	listedNotes,
	type NoteMarkAction,
} from "@daluang/notes/note-list";
import { R } from "@mobily/ts-belt";
import { match, P } from "ts-pattern";
import { z } from "zod";
import type { ChangesStore } from "./changes-store";

/** Why a request of the posts failed. The UI shows one message for each code. */
export type NotesError =
	| "invalid"
	| "slug-taken"
	| "settings-needed"
	| "not-found"
	| "signed-out"
	| "offline"
	| "server";

export const NOTES_ERROR_MESSAGES: Record<NotesError, string> = {
	invalid: "Daluang refused a value. Check each field, then try again.",
	"slug-taken":
		"Another post in this language has this slug. Change the slug, then try again.",
	"settings-needed":
		"Choose the languages of the CMS first. Open Settings, then Languages.",
	"not-found": "The post does not exist. Open the list of posts again.",
	"signed-out": "Your session ended. Sign in again, then try again.",
	offline:
		"Daluang could not reach the server. Check your connection, then try again.",
	server: "The server could not do the request. Try again.",
};

/**
 * The result of one save of the autosave. `saved`: the server stored the value. `refused`:
 * the value cannot be stored as it is, and a retry cannot help. `failed`: a retry can help.
 */
export type AutosaveOutcome = "saved" | "refused" | "failed";

/**
 * What the autosave does after an error of a save. `refused`: the value cannot be stored as
 * it is, so the autosave waits for a change of the writer. `failed`: a retry can help, for
 * example after a sign-in in another tab, so the autosave tries again.
 */
export const SAVE_ERROR_OUTCOMES: Record<
	NotesError,
	Exclude<AutosaveOutcome, "saved">
> = {
	invalid: "refused",
	"slug-taken": "refused",
	"settings-needed": "refused",
	"not-found": "refused",
	"signed-out": "failed",
	offline: "failed",
	server: "failed",
};

/**
 * The longest wait for an answer, in milliseconds. A request with no answer gives `offline`,
 * so a save that hangs does not stop each later save.
 */
export const NOTES_REQUEST_TIMEOUT_MS = 30_000;

const listSchema = z.object({ notes: z.array(noteSummarySchema) });
const oneSchema = z.object({ note: noteSchema });
const errorSchema = z.object({ error: z.string() });

/** The error code of a refused answer. A 409 tells its reason in the body. */
async function refusal(response: Response): Promise<NotesError> {
	const body = await R.fromPromise<unknown>(response.json());
	const code = errorSchema.safeParse(R.getWithDefault(body, null)).data?.error;
	return match({ status: response.status, code })
		.with({ status: 401 }, () => "signed-out" as const)
		.with({ status: 404 }, () => "not-found" as const)
		.with({ status: 409, code: "slug-taken" }, () => "slug-taken" as const)
		.with(
			{ status: 409, code: "settings-needed" },
			() => "settings-needed" as const,
		)
		.with({ status: P.union(400, 413, 415, 422) }, () => "invalid" as const)
		.otherwise(() => "server" as const);
}

/** The answer of the server, of any status. No answer before the timeout gives `offline`. */
async function request(
	path: string,
	init?: RequestInit,
): Promise<R.Result<Response, "offline">> {
	// A rejection of `fetch`, also the `TimeoutError` of the signal, gives `offline`.
	const response = await R.fromPromise(
		fetch(path, {
			...init,
			signal: AbortSignal.timeout(NOTES_REQUEST_TIMEOUT_MS),
		}),
	);
	return R.mapError(response, () => "offline" as const);
}

async function send(
	path: string,
	init?: RequestInit,
): Promise<R.Result<Response, NotesError>> {
	const response = await request(path, init);
	if (R.isError(response)) return R.Error("offline");
	const answer = R.getExn(response);
	if (!answer.ok) return R.Error(await refusal(answer));
	return R.Ok(answer);
}

async function readBody<T>(
	response: R.Result<Response, NotesError>,
	schema: z.ZodType<T>,
): Promise<R.Result<T, NotesError>> {
	if (R.isError(response)) return response;
	const body = await R.fromPromise<unknown>(R.getExn(response).json());
	if (R.isError(body)) return R.Error("server");
	const parsed = schema.safeParse(R.getExn(body));
	return parsed.success ? R.Ok(parsed.data) : R.Error("server");
}

function notePath(id: string): string {
	return `${NOTES_API_PATH}/${encodeURIComponent(id)}`;
}

function json(method: string, body: NoteDraft | ImportFile): RequestInit {
	return {
		method,
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	};
}

/** The summary of each post, the last changed first. */
export async function listNotesOfCms(): Promise<
	R.Result<readonly NoteSummary[], NotesError>
> {
	const body = await readBody(await send(NOTES_API_PATH), listSchema);
	return R.map(body, (list) => list.notes);
}

/** One post, with its body. */
export async function readNote(
	id: string,
): Promise<R.Result<Note, NotesError>> {
	const body = await readBody(await send(notePath(id)), oneSchema);
	return R.map(body, (one) => one.note);
}

/** Adds a post as a draft. */
export async function addNote(
	draft: NoteDraft,
): Promise<R.Result<Note, NotesError>> {
	const body = await readBody(
		await send(NOTES_API_PATH, json("POST", draft)),
		oneSchema,
	);
	return R.map(body, (one) => one.note);
}

export interface NoteSave {
	id: string;
	draft: NoteDraft;
}

/** Writes a draft over a post. */
export async function saveNote(
	save: NoteSave,
): Promise<R.Result<Note, NotesError>> {
	const body = await readBody(
		await send(notePath(save.id), json("PATCH", save.draft)),
		oneSchema,
	);
	return R.map(body, (one) => one.note);
}

/** Deletes a post. */
export async function deleteNoteOfCms(
	id: string,
): Promise<R.Result<true, NotesError>> {
	const response = await send(notePath(id), { method: "DELETE" });
	return R.map(response, () => true as const);
}

export interface NoteMark {
	id: string;
	action: NoteMarkAction;
}

/** Marks a post to publish or to unpublish at Publish changes, or clears its mark. */
export async function markNoteOfCms(
	mark: NoteMark,
): Promise<R.Result<Note, NotesError>> {
	const body = await readBody(
		await send(`${notePath(mark.id)}/${mark.action}`, { method: "POST" }),
		oneSchema,
	);
	return R.map(body, (one) => one.note);
}

/** A post with a change that waits for Publish changes. */
export interface ChangeItem {
	note: NoteSummary;
	change: NoteChange;
}

/** The changes that wait for Publish changes, and their number. */
export interface ChangeList {
	count: number;
	changes: readonly ChangeItem[];
}

const changeListSchema: z.ZodType<ChangeList> = z.object({
	count: z.number(),
	changes: z.array(
		z.object({ note: noteSummarySchema, change: z.enum(NOTE_CHANGES) }),
	),
});

const appliedSchema = z.object({ applied: z.array(z.unknown()) });

/** The changes that wait for Publish changes. */
export async function listChangesOfCms(): Promise<
	R.Result<ChangeList, NotesError>
> {
	return readBody(await send(CHANGES_API_PATH), changeListSchema);
}

/** Publish changes: the CMS applies each change, and each site rebuilds one time. */
export async function publishChanges(): Promise<R.Result<number, NotesError>> {
	const body = await readBody(
		await send(CHANGES_API_PATH, { method: "POST" }),
		appliedSchema,
	);
	return R.map(body, (result) => result.applied.length);
}

/** The posts of the list, each with its change, and the number of changes. */
export interface ListedPosts {
	posts: readonly ListedNote[];
	count: number;
}

/** The posts, the last changed first, each with the change that waits for Publish changes. */
export async function listPostsOfCms(): Promise<
	R.Result<ListedPosts, NotesError>
> {
	const [notes, waiting] = await Promise.all([
		listNotesOfCms(),
		listChangesOfCms(),
	]);
	return R.flatMap(notes, (list) =>
		R.map(waiting, (changes) => ({
			posts: listedNotes({ notes: list, changes: changes.changes }),
			count: changes.count,
		})),
	);
}

/** Reads the number of changes again, and gives it to the store of the navbar. */
export async function refreshChangeCount(changes: ChangesStore): Promise<void> {
	const list = await listChangesOfCms();
	if (R.isOk(list)) changes.write(R.getExn(list).count);
}

// The path of `NOTES_IMPORT_API_PATH`. The module of that constant imports the code of the
// server, so the browser does not import it. A test checks that the two paths are equal.
const NOTES_IMPORT_PATH = `${NOTES_API_PATH}/import`;

/** A post that the import added, and the warnings of its file. */
export interface ImportedPost {
	note: Note;
	warnings: readonly ImportWarning[];
}

/** The codes of a refused import that need no more data. */
export type ImportFailureCode =
	| ImportError
	| "slug-taken"
	| "too-large"
	| Extract<
			NotesError,
			"settings-needed" | "signed-out" | "offline" | "server"
	  >;

/** Why the import of one file failed. `invalid-note` keeps the issues of the draft. */
export type ImportFailure =
	| { code: ImportFailureCode }
	| { code: "invalid-note"; issues: readonly NoteIssue[] };

const issueSchema: z.ZodType<NoteIssue> = z.object({
	path: z.string(),
	message: z.string(),
});

const warningSchema: z.ZodType<ImportWarning> = z.discriminatedUnion("code", [
	z.object({
		code: z.literal("date-not-read"),
		name: z.enum(["publishedAt", "updatedAt"]),
	}),
	z.object({ code: z.literal("field-left-out"), name: z.string() }),
	z.object({
		code: z.literal("component-kept"),
		name: z.string(),
		count: z.number(),
	}),
]);

const importedSchema: z.ZodType<ImportedPost> = z.object({
	note: noteSchema,
	warnings: z.array(warningSchema),
});

const issuesSchema = z.object({ issues: z.array(issueSchema) });

interface RefusedImport {
	status: number;
	body: unknown;
}

function invalidNote(body: unknown): ImportFailure {
	const parsed = issuesSchema.safeParse(body);
	if (!parsed.success) return { code: "server" };
	return { code: "invalid-note", issues: parsed.data.issues };
}

// Each code of `ImportError` of the package. A new code is a type error here, so the client
// does not read it as `server`.
const IMPORT_ERRORS: Record<ImportError, true> = {
	"frontmatter-not-read": true,
	"no-title": true,
};

function isImportError(code: string | undefined): code is ImportError {
	return code !== undefined && Object.hasOwn(IMPORT_ERRORS, code);
}

/** The failure of a refused import. An answer that the client does not expect gives `server`. */
function importRefusal(refused: RefusedImport): ImportFailure {
	const code = errorSchema.safeParse(refused.body).data?.error;
	return match({ status: refused.status, code })
		.with({ status: 401 }, (): ImportFailure => ({ code: "signed-out" }))
		.with({ status: 413 }, (): ImportFailure => ({ code: "too-large" }))
		.with(
			{ status: 409, code: P.union("slug-taken", "settings-needed") },
			(known): ImportFailure => ({ code: known.code }),
		)
		.with(
			{ status: 422, code: P.when(isImportError) },
			(known): ImportFailure => ({ code: known.code }),
		)
		.with({ status: 422, code: "invalid-note" }, () =>
			invalidNote(refused.body),
		)
		.otherwise((): ImportFailure => ({ code: "server" }));
}

/**
 * Imports one Markdown or MDX file as a draft, in the language of the import. The answer
 * has the post and the warnings of its file. A failure keeps the issues of a refused draft.
 */
export async function importNoteOfCms(
	file: ImportFile,
): Promise<R.Result<ImportedPost, ImportFailure>> {
	const response = await request(NOTES_IMPORT_PATH, json("POST", file));
	if (R.isError(response)) return R.Error({ code: "offline" });
	const answer = R.getExn(response);
	const read = await R.fromPromise<unknown>(answer.json());
	const body = R.getWithDefault(read, null);
	if (!answer.ok)
		return R.Error(importRefusal({ status: answer.status, body }));
	const parsed = importedSchema.safeParse(body);
	if (!parsed.success) return R.Error({ code: "server" });
	return R.Ok(parsed.data);
}
