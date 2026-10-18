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
import {
	type ListedNote,
	listedNotes,
	type NoteMarkAction,
} from "@daluang/notes/note-list";
import { R } from "@mobily/ts-belt";
import { match, P } from "ts-pattern";
import { z } from "zod";

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

async function send(
	path: string,
	init?: RequestInit,
): Promise<R.Result<Response, NotesError>> {
	const response = await R.fromPromise(fetch(path, init));
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

function json(method: string, draft: NoteDraft): RequestInit {
	return {
		method,
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(draft),
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
