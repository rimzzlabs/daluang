import { z } from "zod";
import { type ExtraFields, extraValueSchema } from "./extra-fields";
import { NOTE_STATUSES, type NoteMetadata } from "./metadata";

/** The path of the endpoint of the notes. */
export const NOTES_API_PATH = "/api/notes";

/** The marks of a note. A mark waits for Publish changes. */
export const NOTE_MARKS = ["publish", "unpublish", "delete"] as const;

export type NoteMark = (typeof NOTE_MARKS)[number];

/**
 * The copy of a note that the sites read: the draft at the last Publish changes, and the
 * time of its last edit then.
 */
export interface PublishedCopy {
	title: string;
	slug: string;
	language: string;
	description: string;
	keywords: string[];
	fields: ExtraFields;
	body: string;
	updatedAt: string;
}

/**
 * A note as the CMS keeps it: the working copy (the core metadata, the extra fields of the
 * site, and the Markdown body), the published copy, and the mark. The interface calls a
 * note a post.
 */
export interface Note extends NoteMetadata {
	id: string;
	fields: ExtraFields;
	body: string;
	createdAt: string;
	/** The copy that the sites read, or `null` when the sites do not have the note. */
	published: PublishedCopy | null;
	/** The change that waits for Publish changes, or `null`. */
	mark: NoteMark | null;
}

/** A note in a list: its metadata with no body and no extra fields. */
export type NoteSummary = Pick<
	Note,
	| "id"
	| "title"
	| "slug"
	| "language"
	| "status"
	| "publishedAt"
	| "updatedAt"
	| "mark"
>;

/**
 * What a writer gives for a note. The CMS sets the status, the dates, and the ID: a new
 * note is a draft, and a publish is a step of its own.
 */
export type NoteDraft = Pick<
	Note,
	"title" | "slug" | "language" | "description" | "keywords" | "fields" | "body"
>;

/** The schema of a published copy, in D1 and in an answer of the endpoint. */
export const publishedCopySchema: z.ZodType<PublishedCopy> = z.object({
	title: z.string(),
	slug: z.string(),
	language: z.string(),
	description: z.string(),
	keywords: z.array(z.string()),
	fields: z.record(z.string(), extraValueSchema),
	body: z.string(),
	updatedAt: z.string(),
});

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
	published: publishedCopySchema.nullable(),
	mark: z.enum(NOTE_MARKS).nullable(),
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
	mark: true,
});
