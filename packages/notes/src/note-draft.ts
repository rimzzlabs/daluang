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

/** The problem of the value of one defined field, or `None` for a correct value. */
function fieldIssue(
	definition: FieldDefinition,
	fields: ExtraFields,
): O.Option<FieldIssue> {
	const value = fields[definition.name];
	const missing = O.Some({
		name: definition.name,
		message: `Give ${definition.label} a value.`,
	});
	if (value === undefined) return definition.required ? missing : O.None;
	if (!VALUE_SCHEMAS[definition.type].safeParse(value).success)
		return O.Some({
			name: definition.name,
			message: `${definition.label} needs ${VALUE_WORDS[definition.type]}.`,
		});
	return definition.required && isEmptyValue(value) ? missing : O.None;
}

/**
 * The schema of a draft for the settings of a CMS. The language must be a language of the
 * CMS, and each defined field must have its type and, if it is required, a value. An extra
 * field that the settings do not define stays as it is.
 */
export function noteDraftSchema(rules: DraftRules): z.ZodType<NoteDraft> {
	const { shape } = noteMetadataSchema;
	return z.object({
		title: shape.title,
		slug: shape.slug,
		language: shape.language.refine(
			(language) => isLanguageOfCms({ language, setting: rules.languages }),
			"Choose a language of this CMS.",
		),
		description: shape.description,
		keywords: shape.keywords,
		fields: extraFieldsSchema.superRefine((fields, context) => {
			pipe(
				rules.fields,
				A.filterMap((definition) => fieldIssue(definition, fields)),
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
