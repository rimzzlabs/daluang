import {
	type FieldDefinition,
	fieldDefinitionsSchema,
	fieldNameFromLabel,
} from "@daluang/notes/field-definitions";
import { A, D, R } from "@mobily/ts-belt";

/** A field as the writer edits it. The key tells React the rows apart, and D1 does not keep it. */
export interface FieldDraft extends FieldDefinition {
	key: string;
	/** True after the writer types a name. Before that, the name follows the label. */
	nameEdited: boolean;
}

/** The message of each field of a row that is not valid. */
export interface FieldRowErrors {
	label?: string;
	name?: string;
}

export interface FieldErrors {
	/** The errors of each row, by the key of the row. */
	rows: Readonly<Record<string, FieldRowErrors>>;
	/** An error of the list, for example too many fields. */
	list?: string;
}

/**
 * Side effect: makes a random key for each draft. React needs a stable key for each row
 * of the list.
 *
 * The drafts of the stored fields.
 */
export function fieldDrafts(
	fields: readonly FieldDefinition[],
): readonly FieldDraft[] {
	return A.map(fields, (field) => ({
		...field,
		key: crypto.randomUUID(),
		nameEdited: true,
	}));
}

/**
 * Side effect: makes a random key for the draft. React needs a stable key for each row
 * of the list.
 *
 * A new row, empty or from a suggestion.
 */
export function newFieldDraft(suggestion?: FieldDefinition): FieldDraft {
	return {
		key: crypto.randomUUID(),
		name: suggestion?.name ?? "",
		label: suggestion?.label ?? "",
		type: suggestion?.type ?? "text",
		required: suggestion?.required ?? false,
		nameEdited: suggestion !== undefined,
	};
}

/** The draft after a new label. A name that the writer did not type follows the label. */
export function relabelField(draft: FieldDraft, label: string): FieldDraft {
	if (draft.nameEdited) return { ...draft, label };
	return { ...draft, label, name: fieldNameFromLabel(label) };
}

/** The draft after the writer types a name. */
export function renameField(draft: FieldDraft, name: string): FieldDraft {
	return { ...draft, name, nameEdited: true };
}

function toDefinition(draft: FieldDraft): FieldDefinition {
	return D.selectKeys(draft, ["name", "label", "type", "required"]);
}

/** The fields of the drafts, or the message of each row that is not valid. */
export function parseFieldDrafts(
	drafts: readonly FieldDraft[],
): R.Result<FieldDefinition[], FieldErrors> {
	const result = fieldDefinitionsSchema.safeParse(A.map(drafts, toDefinition));
	if (result.success) return R.Ok(result.data);
	return R.Error(
		A.reduce(
			result.error.issues,
			{ rows: {} },
			(errors: FieldErrors, issue) => {
				const [index, field] = issue.path;
				const draft = typeof index === "number" ? drafts[index] : undefined;
				if (draft === undefined || (field !== "label" && field !== "name"))
					return { ...errors, list: errors.list ?? issue.message };
				const row = errors.rows[draft.key] ?? {};
				if (row[field] !== undefined) return errors;
				return {
					...errors,
					rows: {
						...errors.rows,
						[draft.key]: { ...row, [field]: issue.message },
					},
				};
			},
		),
	);
}

export interface SuggestionQuery {
	suggestions: readonly FieldDefinition[];
	drafts: readonly FieldDraft[];
}

/** The suggestions that the list does not have yet. */
export function openSuggestions(
	query: SuggestionQuery,
): readonly FieldDefinition[] {
	const names = A.map(query.drafts, (draft) => draft.name);
	return A.reject(query.suggestions, (suggestion) =>
		A.includes(names, suggestion.name),
	);
}
