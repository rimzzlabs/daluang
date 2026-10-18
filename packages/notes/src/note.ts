import { z } from "zod";
import { type ExtraFields, extraValueSchema } from "./extra-fields";
import { NOTE_STATUSES, type NoteMetadata } from "./metadata";

/** The path of the endpoint of the notes. */
export const NOTES_API_PATH = "/api/notes";

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

const noteShape = z.object({
	id: z.string(),
	title: z.string(),
	slug: z.string(),
	language: z.string(),
	description: z.string(),
	keywords: z.array(z.string()),
	status: z.enum(NOTE_STATUSES),
	publishedAt: z.string().nullable(),
	updatedAt: z.string(),
	createdAt: z.string(),
	fields: z.record(z.string(), extraValueSchema),
	body: z.string(),
});

/** A note in an answer of the endpoint. The browser reads the answer with it. */
export const noteSchema: z.ZodType<Note> = noteShape;

/** A summary in the list of the endpoint. */
export const noteSummarySchema: z.ZodType<NoteSummary> = noteShape.pick({
	id: true,
	title: true,
	slug: true,
	language: true,
	status: true,
	publishedAt: true,
	updatedAt: true,
});
