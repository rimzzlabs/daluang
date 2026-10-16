import { z } from "zod";
import { languageTagSchema } from "./language";
import { slugSchema } from "./slug";

export const NOTE_STATUSES = ["draft", "published"] as const;

export type NoteStatus = (typeof NOTE_STATUSES)[number];

/** The core metadata of a note. Each site gets these fields. */
export const noteMetadataSchema = z
	.object({
		title: z.string().trim().min(1, "Give the note a title.").max(200),
		slug: slugSchema,
		language: languageTagSchema,
		description: z.string().trim().max(300).default(""),
		keywords: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
		status: z.enum(NOTE_STATUSES),
		publishedAt: z.iso.datetime().nullable(),
		updatedAt: z.iso.datetime(),
	})
	.refine(
		(metadata) => metadata.status === "draft" || metadata.publishedAt !== null,
		{
			message: "A published note needs a publishedAt date.",
			path: ["publishedAt"],
		},
	);

export type NoteMetadata = z.infer<typeof noteMetadataSchema>;

/** The names of the core fields. An extra field cannot use one of them. */
export const CORE_FIELDS = [
	"title",
	"slug",
	"language",
	"description",
	"keywords",
	"status",
	"publishedAt",
	"updatedAt",
] as const satisfies readonly (keyof NoteMetadata)[];
