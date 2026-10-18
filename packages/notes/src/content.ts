import { A, O, pipe } from "@mobily/ts-belt";
import { type MarkdownDocument, parseMarkdown } from "comark";
import type { Note, PublishedCopy } from "./note";
import { listPublishedNotes } from "./store";

/** The path of the content API of the notes. A site reads it with an API token. */
export const CONTENT_NOTES_API_PATH = "/api/content/notes";

/**
 * A published note for a site: its published copy (the metadata, the extra fields, and the
 * Markdown), and the Comark document of the Markdown. A site renders the document with its
 * own components. A site never gets the working copy or the mark.
 */
export interface ContentNote extends PublishedCopy {
	id: string;
	status: "published";
	publishedAt: string | null;
	createdAt: string;
	document: MarkdownDocument;
}

type ContentCopy = Omit<ContentNote, "document">;

/** The published copy of a note for a site, or `None` when the sites do not have it. */
function contentCopy(note: Note): O.Option<ContentCopy> {
	if (note.published === null) return O.None;
	return O.Some({
		...note.published,
		id: note.id,
		status: "published",
		publishedAt: note.publishedAt,
		createdAt: note.createdAt,
	});
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

async function withDocument(copy: ContentCopy): Promise<ContentNote> {
	return { ...copy, document: await parseMarkdown(copy.body) };
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
	const copies = pipe(
		await listPublishedNotes(params.db),
		A.filterMap(contentCopy),
	);
	return Response.json({
		notes: await Promise.all(A.map(copies, withDocument)),
	});
}
