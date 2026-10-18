import type { ExtraFields } from "./extra-fields";
import type { NoteMetadata } from "./metadata";

/**
 * A note as the CMS keeps it: the core metadata, the extra fields of the site, and the
 * Markdown body. The interface calls a note a post.
 */
export interface Note extends NoteMetadata {
	id: string;
	fields: ExtraFields;
	body: string;
	createdAt: string;
}

/** A note in a list: its metadata with no body and no extra fields. */
export type NoteSummary = Pick<
	Note,
	"id" | "title" | "slug" | "language" | "status" | "publishedAt" | "updatedAt"
>;

/**
 * What a writer gives for a note. The CMS sets the status, the dates, and the ID: a new
 * note is a draft, and a publish is a step of its own.
 */
export type NoteDraft = Pick<
	Note,
	"title" | "slug" | "language" | "description" | "keywords" | "fields" | "body"
>;
