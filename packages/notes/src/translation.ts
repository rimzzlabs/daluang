import { A, pipe } from "@mobily/ts-belt";
import type { NoteDraft } from "./note";

/** The two fields that place a note among its translations. */
export interface NoteKey {
	slug: string;
	language: string;
}

export interface TranslationQuery<T extends NoteKey> {
	note: NoteKey;
	notes: readonly T[];
}

/**
 * The translations of a note: the other notes with the same slug, in a different language.
 * This is the rule of rimzzlabs.com, where `notes/en/<slug>` and `notes/id/<slug>` are one
 * note in two languages.
 */
export function translationsOf<T extends NoteKey>(
	query: TranslationQuery<T>,
): readonly T[] {
	return A.filter(
		query.notes,
		(other) =>
			other.slug === query.note.slug && other.language !== query.note.language,
	);
}

/** True when a note with this slug and language exists. A slug is unique in each language. */
export function isSlugTaken<T extends NoteKey>(
	query: TranslationQuery<T>,
): boolean {
	return A.some(
		query.notes,
		(other) =>
			other.slug === query.note.slug && other.language === query.note.language,
	);
}

export interface MissingQuery<T extends NoteKey> extends TranslationQuery<T> {
	/** The languages of the CMS, in the order of the setting. */
	languages: readonly string[];
}

/** The languages of the CMS that have no translation of a note yet, in the order of the setting. */
export function missingLanguages<T extends NoteKey>(
	query: MissingQuery<T>,
): readonly string[] {
	const translated = pipe(
		translationsOf(query),
		A.map((other) => other.language),
	);
	return A.reject(
		query.languages,
		(language) =>
			language === query.note.language || A.includes(translated, language),
	);
}

/**
 * The draft of a new translation: a copy of the note in another language, with the same
 * slug. The writer then translates its text.
 */
export function translationDraft(note: NoteDraft, language: string): NoteDraft {
	return {
		title: note.title,
		slug: note.slug,
		language,
		description: note.description,
		keywords: note.keywords,
		fields: note.fields,
		body: note.body,
	};
}
