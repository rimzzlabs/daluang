import { A } from "@mobily/ts-belt";

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
