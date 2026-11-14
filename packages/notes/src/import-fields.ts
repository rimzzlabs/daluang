import { A, D, O, pipe, S } from "@mobily/ts-belt";
import type { z } from "zod";
import { extraValueSchema, isCoreField, isFieldName } from "./extra-fields";

/** A key of the frontmatter that the import does not use. */
export interface FieldLeftOut {
	code: "field-left-out";
	name: string;
}

/** The extra fields of a frontmatter, and the keys that the import does not use. */
export interface ImportedFields {
	fields: Record<string, z.infer<typeof extraValueSchema>>;
	/** The core keys first, in the order of `TEXT_KEYS`, then the extra keys in their order. */
	warnings: readonly FieldLeftOut[];
}

/** The core keys that the import reads as a text, or as a list of texts for the keywords. */
const TEXT_KEYS = ["slug", "description", "keywords", "status"] as const;

/** True for a value that is not `null` and not `undefined`. */
export function isPresent(value: unknown): boolean {
	return value !== null && value !== undefined;
}

function isText(value: unknown): boolean {
	return typeof value === "string" || Number.isFinite(value);
}

/** A text, or a finite number as its text, after a trim. An empty text is `None`. */
export function textOf(value: unknown): O.Option<string> {
	if (!isText(value)) return O.None;
	return pipe(
		String(value),
		S.trim,
		O.fromPredicate((text) => !S.isEmpty(text)),
	);
}

function leftOut(name: string): FieldLeftOut {
	return { code: "field-left-out", name };
}

/** True when the import reads the value of the key, or when the key has no value. */
function isReadable(key: (typeof TEXT_KEYS)[number], value: unknown): boolean {
	if (!isPresent(value) || isText(value)) return true;
	if (key !== "keywords" || !Array.isArray(value)) return false;
	return A.every(value, (item) => !isPresent(item) || isText(item));
}

function keywordItems(value: unknown): readonly unknown[] {
	if (Array.isArray(value)) return value;
	if (isText(value)) return S.split(String(value), ",");
	return [];
}

/** The keywords of a list, or of a text split at commas: each text or number, trimmed. */
export function importKeywords(value: unknown): string[] {
	return [...pipe(keywordItems(value), A.filterMap(textOf))];
}

/**
 * Each key that is not a core key or `lang` becomes an extra field, if its name and value
 * fit. A key that cannot be a field, and a core key with a value of another kind, give the
 * warning `field-left-out`.
 */
export function importFields(
	frontmatter: Record<string, unknown>,
): ImportedFields {
	const read = pipe(
		D.toPairs(frontmatter),
		A.reject(
			(entry) =>
				isCoreField(entry[0]) || entry[0] === "lang" || !isPresent(entry[1]),
		),
		A.map((entry) => {
			const [name, value] = entry;
			const parsed = extraValueSchema.safeParse(value);
			const fits = isFieldName(name) && parsed.success;
			return { name, value: fits ? O.Some(parsed.data) : O.None };
		}),
	);
	return {
		// `isFieldName` refuses `__proto__`, so `D.fromPairs` cannot change the prototype.
		fields: pipe(
			read,
			A.filterMap((field) =>
				O.map(field.value, (value) => [field.name, value] as const),
			),
			D.fromPairs,
		),
		warnings: [
			...pipe(
				TEXT_KEYS,
				A.reject((key) => isReadable(key, frontmatter[key])),
				A.map(leftOut),
			),
			...pipe(
				read,
				A.filter((field) => O.isNone(field.value)),
				A.map((field) => leftOut(field.name)),
			),
		],
	};
}
