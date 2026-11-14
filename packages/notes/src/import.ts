import { O, pipe, R, S } from "@mobily/ts-belt";
import { z } from "zod";
import {
	type NoteIssue,
	type NoteSettings,
	type NotesApiError,
	notAllowed,
	readJsonBody,
} from "./api";
import {
	checkedImport,
	type ImportCheck,
	importFileOf,
	importMark,
	importRules,
} from "./import-draft";
import type { DraftRules } from "./note-draft";
import { type ImportError, type ImportFile, importedNote } from "./note-import";
import { createImportedNote } from "./store";

/** The path of the import endpoint of the notes. */
export const NOTES_IMPORT_API_PATH = "/api/notes/import";

/** The error codes of the import endpoint. The browser shows one message for each code. */
export type ImportApiError = NotesApiError | ImportError | "invalid-import";

export interface ImportRequest {
	request: Request;
	db: D1Database;
	settings: NoteSettings;
	/** The clock. The route file gives `() => new Date()`, and a test gives a fixed time. */
	now: () => Date;
}

function errorResponse(error: ImportApiError, status: number): Response {
	return Response.json({ error }, { status });
}

function issuesResponse(error: ImportApiError) {
	return (issues: readonly NoteIssue[]): Response =>
		Response.json({ error, issues }, { status: 422 });
}

// The text of the refusal of the unique index `note_slug_language_idx`. D1 adds the
// prefix `D1_ERROR:`, and SQLite of Node.js gives the text alone.
const SLUG_REFUSAL = "UNIQUE constraint failed: note.slug, note.language";

// A thrown value with a message. An error can come from another realm, so the check does
// not use `instanceof Error`.
const thrownSchema = z.object({ message: z.string() });

function isSlugRefusal(error: unknown): boolean {
	const thrown = thrownSchema.safeParse(error);
	return thrown.success && S.includes(thrown.data.message, SLUG_REFUSAL);
}

/**
 * Side effect: writes the imported note to D1, so that the post stays after this request.
 *
 * The unique index is the one check of the slug, so two imports at the same time cannot
 * both add the slug. Its refusal answers 409. Another error of D1 is thrown again.
 */
async function writeImported(
	params: ImportRequest,
	check: ImportCheck,
): Promise<Response> {
	const { imported } = check;
	try {
		const note = await createImportedNote({
			db: params.db,
			imported,
			mark: importMark(check),
			now: params.now(),
		});
		return Response.json(
			{ note, warnings: imported.warnings },
			{ status: 201 },
		);
	} catch (error) {
		if (isSlugRefusal(error)) return errorResponse("slug-taken", 409);
		throw error;
	}
}

function refused(response: Response): Promise<Response> {
	return Promise.resolve(response);
}

interface ImportSource {
	params: ImportRequest;
	rules: DraftRules;
	file: ImportFile;
}

/** Side effect: writes D1 when the file gives a draft that the settings accept. */
async function importFile(source: ImportSource): Promise<Response> {
	const { params, rules } = source;
	const checked = pipe(
		await importedNote(source.file),
		R.mapError((error) => errorResponse(error, 422)),
		R.flatMap((imported) =>
			pipe(
				checkedImport({ imported, rules }),
				R.mapError(issuesResponse("invalid-note")),
			),
		),
	);
	return R.match(
		checked,
		(imported) => writeImported(params, { imported, rules }),
		refused,
	);
}

/** Side effect: reads the body of the request, then writes D1. */
async function importWith(
	params: ImportRequest,
	rules: DraftRules,
): Promise<Response> {
	const file = R.flatMap(await readJsonBody(params.request), (body) =>
		R.mapError(importFileOf(body), issuesResponse("invalid-import")),
	);
	return R.match(
		file,
		(read) => importFile({ params, rules, file: read }),
		refused,
	);
}

/**
 * Side effect: writes the table `note` of D1, because D1 keeps the notes of the CMS.
 *
 * The import endpoint of the notes. `POST /api/notes/import` turns one Markdown or MDX
 * file into a draft, with the dates of its frontmatter. A file with `status: published`
 * gets the mark `publish` when `importMark` accepts it. The sites change only at Publish
 * changes. The sign-in guard checks the session and the origin before this handler runs.
 */
export function handleImportRequest(params: ImportRequest): Promise<Response> {
	if (params.request.method !== "POST") return notAllowed("POST");
	return O.match(
		importRules(params.settings),
		(rules) => importWith(params, rules),
		() => refused(errorResponse("settings-needed", 409)),
	);
}
