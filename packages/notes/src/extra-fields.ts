import { A, pipe } from "@mobily/ts-belt";
import { z } from "zod";
import { CORE_FIELDS } from "./metadata";

export const EXTRA_FIELDS_MAX = 30;

// A name in camelCase or snake_case, as a frontmatter key: `featured`, `relatedPosts`.
const EXTRA_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,39}$/;

/** The value of an extra field: text, a number, true or false, or a list of text. */
export const extraValueSchema = z.union([
	z.string().max(2000),
	z.number(),
	z.boolean(),
	z.array(z.string().max(200)).max(50),
]);

/** True for the name of a core field: an extra field cannot use it. */
export function isCoreField(key: string): boolean {
	return A.some(CORE_FIELDS, (field) => field === key);
}

/** True when the name of an extra field has the form of a frontmatter key. */
export function isFieldName(key: string): boolean {
	return EXTRA_KEY_PATTERN.test(key);
}

// A zod record drops a key such as `__proto__` before a refine can see it. This first step
// reads the own keys of the raw input, so the writer gets a message for each wrong name.
const fieldNamesSchema = z.unknown().superRefine((value, context) => {
	if (typeof value !== "object" || value === null) return;
	pipe(
		Object.keys(value),
		A.reject(isFieldName),
		A.forEach((key) => {
			context.addIssue({
				code: "custom",
				message: `"${key}" is not a field name. Use a name such as featured or relatedPosts.`,
				path: [key],
			});
		}),
	);
});

/**
 * The fields that a site adds to the core metadata, for example `featured`, `author`, or
 * `relatedPosts`. Each site has its own schema, so Daluang keeps these fields as they are.
 */
export const extraFieldsSchema = fieldNamesSchema.pipe(
	z.record(z.string(), extraValueSchema).superRefine((fields, context) => {
		const keys = Object.keys(fields);
		pipe(
			keys,
			A.filter(isCoreField),
			A.forEach((key) => {
				context.addIssue({
					code: "custom",
					message: `${key} is a core field. Give the extra field a different name.`,
					path: [key],
				});
			}),
		);
		if (A.length(keys) > EXTRA_FIELDS_MAX) {
			context.addIssue({
				code: "custom",
				message: `A post can have ${EXTRA_FIELDS_MAX} extra fields or fewer.`,
			});
		}
	}),
);

export type ExtraFields = z.infer<typeof extraFieldsSchema>;
