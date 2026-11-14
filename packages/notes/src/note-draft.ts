import { A, O, pipe, S } from "@mobily/ts-belt";
import { z } from "zod";
import {
	type ExtraFields,
	extraFieldsSchema,
	type extraValueSchema,
} from "./extra-fields";
import type { FieldDefinition, FieldType } from "./field-definitions";
import { isLanguageOfCms, type LanguagesSetting } from "./languages-setting";
import { noteMetadataSchema } from "./metadata";
import type { NoteDraft } from "./note";
import { freeSlug, type NoteKey } from "./translation";

/** The size limit of a body, in bytes: half of the size limit of a row of D1, 2 MB. */
export const NOTE_BODY_MAX_BYTES = 1_000_000;

/** The settings of a CMS that a draft must obey. */
export interface DraftRules {
	languages: LanguagesSetting;
	fields: readonly FieldDefinition[];
}

const VALUE_SCHEMAS: Record<FieldType, z.ZodType> = {
	text: z.string(),
	number: z.number(),
	boolean: z.boolean(),
	list: z.array(z.string()),
};

const VALUE_WORDS: Record<FieldType, string> = {
	text: "a text",
	number: "a number",
	boolean: "yes or no",
	list: "a list of text",
};

function isEmptyValue(value: z.infer<typeof extraValueSchema>): boolean {
	if (typeof value === "string") return pipe(value, S.trim, S.isEmpty);
	return Array.isArray(value) && A.isEmpty(value);
}

interface FieldIssue {
	name: string;
	message: string;
}

interface FieldCheck {
	definition: FieldDefinition;
	fields: ExtraFields;
	/** True at Publish: a required field must then have a value. */
	requireValues: boolean;
}

/** The problem of the value of one defined field, or `None` for a correct value. */
function fieldIssue(check: FieldCheck): O.Option<FieldIssue> {
	const { definition, fields, requireValues } = check;
	const value = fields[definition.name];
	const required = requireValues && definition.required;
	const missing = O.Some({
		name: definition.name,
		message: `Give ${definition.label} a value.`,
	});
	if (value === undefined) return required ? missing : O.None;
	if (!VALUE_SCHEMAS[definition.type].safeParse(value).success)
		return O.Some({
			name: definition.name,
			message: `${definition.label} needs ${VALUE_WORDS[definition.type]}.`,
		});
	return required && isEmptyValue(value) ? missing : O.None;
}

interface DraftCheck {
	rules: DraftRules;
	requireValues: boolean;
}

function draftSchema(check: DraftCheck): z.ZodType<NoteDraft> {
	const { rules, requireValues } = check;
	const { shape } = noteMetadataSchema;
	return z.object({
		title: shape.title,
		slug: shape.slug,
		language: shape.language.refine(
			(language) => isLanguageOfCms({ language, setting: rules.languages }),
			"This language is not in the settings of the CMS. Choose another language.",
		),
		description: shape.description,
		keywords: shape.keywords,
		fields: extraFieldsSchema.superRefine((fields, context) => {
			pipe(
				rules.fields,
				A.filterMap((definition) =>
					fieldIssue({ definition, fields, requireValues }),
				),
				A.forEach((issue) => {
					context.addIssue({
						code: "custom",
						message: issue.message,
						path: [issue.name],
					});
				}),
			);
		}),
		body: z
			.string()
			.refine(
				(body) => new TextEncoder().encode(body).length <= NOTE_BODY_MAX_BYTES,
				"Keep the post at 1 MB or less.",
			),
	});
}

/**
 * The schema of a draft that the writer saves. The language must be a language of the CMS,
 * and each defined field must have its type. A required field can be empty: Publish asks
 * for its value. An extra field that the settings do not define stays as it is.
 */
export function noteDraftSchema(rules: DraftRules): z.ZodType<NoteDraft> {
	return draftSchema({ rules, requireValues: false });
}

/**
 * The schema of a draft at Publish: the schema of a saved draft, and a value for each
 * required field.
 */
export function publishedDraftSchema(rules: DraftRules): z.ZodType<NoteDraft> {
	return draftSchema({ rules, requireValues: true });
}

export const UNTITLED_SLUG = "untitled";

/** True for the slug of an untitled draft: `untitled`, `untitled-2`, and so on. */
export function isUntitledSlug(slug: string): boolean {
	return /^untitled(?:-\d+)?$/.test(slug);
}

export interface UntitledQuery {
	/** The notes of the CMS. The slug of the draft must be free in its language. */
	notes: readonly NoteKey[];
	rules: DraftRules;
}

/**
 * The draft that New post adds at once, in the default language: "Untitled" with the slug
 * `untitled`, or "Untitled 2" with the slug `untitled-2` when the language has `untitled`.
 * The title and the slug then follow each other until the writer types a slug.
 */
export function untitledDraft(query: UntitledQuery): NoteDraft {
	const language = query.rules.languages.defaultLanguage;
	const slug = freeSlug({
		note: { slug: UNTITLED_SLUG, language },
		notes: query.notes,
	});
	return {
		title: pipe(
			slug,
			S.replace(UNTITLED_SLUG, "Untitled"),
			S.replace("-", " "),
		),
		slug,
		language,
		description: "",
		keywords: [],
		fields: {},
		body: "",
	};
}
