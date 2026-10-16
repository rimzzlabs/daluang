import { A, pipe, S } from "@mobily/ts-belt";
import { z } from "zod";
import { EXTRA_FIELDS_MAX, isCoreField, isFieldName } from "./extra-fields";

/** The kinds of value of an extra field. They are the values of `extraValueSchema`. */
export const FIELD_TYPES = ["text", "number", "boolean", "list"] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_LABEL_MAX_LENGTH = 60;

/** One extra field that a site reads from each note, for example `featured`. */
export const fieldDefinitionSchema = z.object({
	/** The key of the field in the frontmatter of a note: `relatedPosts`. */
	name: z
		.string()
		.refine(
			isFieldName,
			"Start the name with a letter. Then use letters, digits, or _: relatedPosts.",
		)
		.refine(
			(name) => !isCoreField(name),
			"Each note has this core field. Give the field a different name.",
		),
	/** The name of the field in the editor: `Related posts`. */
	label: z
		.string()
		.trim()
		.min(1, "Give the field a label.")
		.max(
			FIELD_LABEL_MAX_LENGTH,
			`Keep the label at ${FIELD_LABEL_MAX_LENGTH} characters or fewer.`,
		),
	type: z.enum(FIELD_TYPES),
	/** True when each note must have a value. */
	required: z.boolean(),
});

export type FieldDefinition = z.infer<typeof fieldDefinitionSchema>;

/** The extra fields of a site. Each name is on the list one time. */
export const fieldDefinitionsSchema = z
	.array(fieldDefinitionSchema)
	.max(EXTRA_FIELDS_MAX, `A site can have ${EXTRA_FIELDS_MAX} fields or fewer.`)
	.superRefine((fields, context) => {
		const names = A.map(fields, (field) => field.name);
		A.forEachWithIndex(names, (index, name) => {
			if (names.indexOf(name) === index) return;
			context.addIssue({
				code: "custom",
				message: "Another field has this name. Give each field its own name.",
				path: [index, "name"],
			});
		});
	});

/**
 * The frontmatter key of a label, in camelCase: `relatedPosts` for "Related posts". A label
 * with no letter gives an empty name, and the writer types one.
 */
export function fieldNameFromLabel(label: string): string {
	// `normalize` splits a letter from its accent. ts-belt has no such function.
	const words = pipe(
		label.normalize("NFKD"),
		S.replaceByRe(/[̀-ͯ]/g, ""),
		S.replaceByRe(/[^A-Za-z0-9]+/g, " "),
		S.trim,
		S.split(" "),
		A.reject(S.isEmpty),
		A.dropWhile((word) => !/^[A-Za-z]/.test(word)),
	);
	return pipe(
		words,
		A.mapWithIndex((index, word) => {
			const lower = S.toLowerCase(word);
			if (index === 0) return lower;
			const first = pipe(lower, S.slice(0, 1), S.toUpperCase);
			return `${first}${S.sliceToEnd(lower, 1)}`;
		}),
		A.join(""),
		S.slice(0, 40),
	);
}
