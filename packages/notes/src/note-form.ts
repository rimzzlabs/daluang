import { A, D, O, pipe, R, S } from "@mobily/ts-belt";
import { match } from "ts-pattern";
import type { ExtraFields } from "./extra-fields";
import type { FieldDefinition } from "./field-definitions";
import type { Note, NoteDraft } from "./note";
import {
	type DraftRules,
	isUntitledSlug,
	noteDraftSchema,
	publishedDraftSchema,
} from "./note-draft";
import { slugify } from "./slug";

/** The value of an extra field in the editor: a text, or yes or no for a boolean field. */
export type FieldInput = string | boolean;

/** A post as the writer types it in the editor. Each value is as its input gives it. */
export interface NoteForm {
	title: string;
	slug: string;
	/** True after the writer types a slug. Until then, the slug follows the title. */
	slugTouched: boolean;
	language: string;
	description: string;
	/** The keywords, with a comma between two keywords. */
	keywords: string;
	/** The input of each defined field, by the name of the field. */
	fields: Record<string, FieldInput>;
	/**
	 * The stored extra fields that the settings do not define. The editor does not show
	 * them, and a save keeps them as they are.
	 */
	kept: ExtraFields;
	body: string;
}

/**
 * The message of each value that is not valid, by the key of its input: `title`, or
 * `fields.featured` for an extra field. An item of a list gives the key of the list.
 */
export type NoteFormErrors = Record<string, string>;

function emptyInput(definition: FieldDefinition): FieldInput {
	return definition.type === "boolean" ? false : "";
}

/** An empty form for a new post, in the default language of the CMS. */
export function emptyNoteForm(rules: DraftRules): NoteForm {
	return {
		title: "",
		slug: "",
		slugTouched: false,
		language: rules.languages.defaultLanguage,
		description: "",
		keywords: "",
		fields: pipe(
			rules.fields,
			A.map((definition) => [definition.name, emptyInput(definition)] as const),
			D.fromPairs,
		),
		kept: {},
		body: "",
	};
}

/** The input of a stored value. A value of another type becomes text, as well as it can. */
function storedInput(
	definition: FieldDefinition,
	value: ExtraFields[string] | undefined,
): FieldInput {
	if (value === undefined) return emptyInput(definition);
	if (definition.type === "boolean") return value === true;
	if (Array.isArray(value)) return A.join(value, ", ");
	return String(value);
}

/**
 * The form of a stored post. The slug counts as typed, so a new title does not change the
 * address of the post. An untitled draft that was never published is the exception: its
 * slug follows the title, so the first title gives the slug.
 */
export function noteFormOf(
	note: Note,
	definitions: readonly FieldDefinition[],
): NoteForm {
	const defined = A.map(definitions, (definition) => definition.name);
	return {
		title: note.title,
		slug: note.slug,
		slugTouched: note.publishedAt !== null || !isUntitledSlug(note.slug),
		language: note.language,
		description: note.description,
		keywords: A.join(note.keywords, ", "),
		fields: pipe(
			definitions,
			A.map(
				(definition) =>
					[
						definition.name,
						storedInput(definition, note.fields[definition.name]),
					] as const,
			),
			D.fromPairs,
		),
		kept: pipe(
			note.fields,
			D.toPairs,
			A.reject(([name]) => A.includes(defined, name)),
			D.fromPairs,
		),
		body: note.body,
	};
}

/** The form with a new title. A slug that the writer did not type follows the title. */
export function withTitle(form: NoteForm, title: string): NoteForm {
	if (form.slugTouched) return { ...form, title };
	return { ...form, title, slug: slugify(title) };
}

/** The form with a slug that the writer typed. An empty slug follows the title again. */
export function withSlug(form: NoteForm, slug: string): NoteForm {
	return { ...form, slug, slugTouched: !S.isEmpty(slug) };
}

/** The items of a text with a comma between two items. An empty item is not an item. */
function splitList(text: string): readonly string[] {
	return pipe(text, S.split(","), A.map(S.trim), A.reject(S.isEmpty));
}

/**
 * The value of a field in the draft, or `None` for an empty input. The draft schema then
 * asks for a value of a required field. A number field with a text that is not a number
 * keeps the text, so the draft schema tells the writer that the field needs a number.
 */
function fieldValue(
	definition: FieldDefinition,
	input: FieldInput,
): O.Option<unknown> {
	if (typeof input === "boolean") return O.Some(input);
	if (pipe(input, S.trim, S.isEmpty)) return O.None;
	return match(definition.type)
		.with("number", () => {
			const number = Number(input);
			return O.Some(Number.isFinite(number) ? number : input);
		})
		.with("list", () => O.Some(splitList(input)))
		.otherwise(() => O.Some(input));
}

function draftFields(
	form: NoteForm,
	definitions: readonly FieldDefinition[],
): Record<string, unknown> {
	return pipe(
		definitions,
		A.filterMap((definition) =>
			pipe(
				fieldValue(definition, form.fields[definition.name] ?? ""),
				O.map((value) => [definition.name, value] as const),
			),
		),
		D.fromPairs,
	);
}

interface Issue {
	path: readonly PropertyKey[];
	message: string;
}

/**
 * The key of the input that shows an issue. An index belongs to its array, so the path
 * stops before the first index: `keywords.1` shows at `keywords`, and `fields.tags.0` at
 * `fields.tags`. A name in a path is a text, so a field name of digits keeps its place.
 */
function errorKey(path: readonly PropertyKey[]): string {
	return pipe(
		path,
		A.takeWhile((segment) => typeof segment !== "number"),
		A.map(String),
		A.join("."),
	);
}

/** The first message of each input. */
function formErrors(issues: readonly Issue[]): NoteFormErrors {
	return pipe(
		issues,
		A.map((issue) => [errorKey(issue.path), issue.message] as const),
		A.reverse,
		D.fromPairs,
	);
}

/** One thing that stops a publish: the label of the input, and what the writer must do. */
export interface PublishBlocker {
	label: string;
	message: string;
}

const CORE_LABELS: Record<string, string> = {
	title: "Title",
	slug: "Slug",
	language: "Language",
	description: "Description",
	keywords: "Keywords",
	body: "Body",
	fields: "Extra fields",
};

function blockerLabel(
	key: string,
	definitions: readonly FieldDefinition[],
): string {
	if (!S.startsWith(key, FIELD_KEY)) return CORE_LABELS[key] ?? key;
	const name = S.sliceToEnd(key, S.length(FIELD_KEY));
	return A.find(definitions, (item) => item.name === name)?.label ?? name;
}

/**
 * The label of the input of an issue path of an answer 422, for example `title` or
 * `fields.tags.0`. The path is a text, so the label of an extra field comes from the name
 * after `fields`, and a core input from the first segment.
 */
export function issueLabel(
	path: string,
	definitions: readonly FieldDefinition[],
): string {
	const segments = S.split(path, ".");
	const key = pipe(
		segments,
		A.take(segments[0] === "fields" ? 2 : 1),
		A.join("."),
	);
	return blockerLabel(key, definitions);
}

/**
 * What stops a publish of a note: one entry for each input, with its first message. An
 * empty list means that Daluang can publish the note. The inputs have the keys of `formErrors`.
 */
export function publishBlockers(
	note: NoteDraft,
	rules: DraftRules,
): readonly PublishBlocker[] {
	const result = publishedDraftSchema(rules).safeParse(note);
	if (result.success) return [];
	return pipe(
		result.error.issues,
		A.map((issue) => [errorKey(issue.path), issue.message] as const),
		A.uniqBy(([key]) => key),
		A.map(([key, message]) => ({
			label: blockerLabel(key, rules.fields),
			message,
		})),
	);
}

const CORE_INPUTS = [
	"title",
	"slug",
	"language",
	"description",
	"keywords",
	"body",
];

const FIELD_KEY = "fields.";

/** The message of an error with no input. An extra field gets its name first. */
function unshownMessage(error: readonly [string, string]): string {
	const [key, message] = error;
	if (!S.startsWith(key, FIELD_KEY)) return message;
	return `${S.sliceToEnd(key, S.length(FIELD_KEY))}: ${message}`;
}

/**
 * The messages of the errors that no input shows: a key that is not a core input and not
 * a defined field. A stored extra field that the settings no longer define can cause one,
 * so its message starts with the name of the field.
 */
export function unshownErrors(
	errors: NoteFormErrors,
	definitions: readonly FieldDefinition[],
): readonly string[] {
	const shown = [
		...CORE_INPUTS,
		...A.map(definitions, (definition) => `fields.${definition.name}`),
	];
	return pipe(
		errors,
		D.toPairs,
		A.reject(([key]) => A.includes(shown, key)),
		A.map(unshownMessage),
	);
}

/** The draft of a form, checked with the settings of the CMS, or the message of each error. */
export function parseNoteForm(
	form: NoteForm,
	rules: DraftRules,
): R.Result<NoteDraft, NoteFormErrors> {
	const result = noteDraftSchema(rules).safeParse({
		title: form.title,
		slug: form.slug,
		language: form.language,
		description: form.description,
		keywords: splitList(form.keywords),
		fields: { ...form.kept, ...draftFields(form, rules.fields) },
		body: form.body,
	});
	if (result.success) return R.Ok(result.data);
	return R.Error(formErrors(result.error.issues));
}
