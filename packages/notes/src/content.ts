import { A } from "@mobily/ts-belt";
import { type MarkdownDocument, parseMarkdown } from "comark";
import type { Note } from "./note";
import { listPublishedNotes } from "./store";

/** The path of the content API of the notes. A site reads it with an API token. */
export const CONTENT_NOTES_API_PATH = "/api/content/notes";

/**
 * A published note for a site: its metadata, its extra fields, its Markdown, and the
 * Comark document of the Markdown. A site renders the document with its own components.
 */
export interface ContentNote extends Note {
	document: MarkdownDocument;
}

export interface ContentRequest {
	request: Request;
	db: D1Database;
	/**
	 * True for the `Authorization` header of a valid API token. The route file checks it
	 * with `verifyApiToken`, so the notes package does not import the API tokens package.
	 */
	authorize: (authorization: string | null) => Promise<boolean>;
}

async function toContentNote(note: Note): Promise<ContentNote> {
	return { ...note, document: await parseMarkdown(note.body) };
}

/**
 * Side effect: reads the published notes of D1 for a site, after the check of its token.
 *
 * The content API of the notes. `GET /api/content/notes` gives each published note. A
 * request with no valid API token answers 401, and another method answers 405.
 */
export async function handleContentRequest(
	params: ContentRequest,
): Promise<Response> {
	const { request } = params;
	if (request.method !== "GET")
		return Response.json(
			{ error: "method-not-allowed" },
			{ status: 405, headers: { Allow: "GET" } },
		);
	if (!(await params.authorize(request.headers.get("authorization"))))
		return Response.json(
			{ error: "unauthorized" },
			{ status: 401, headers: { "WWW-Authenticate": "Bearer" } },
		);
	const notes = await listPublishedNotes(params.db);
	return Response.json({
		notes: await Promise.all(A.map(notes, toContentNote)),
	});
}
