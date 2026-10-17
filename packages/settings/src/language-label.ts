import { languageName } from "@daluang/notes/language";

/**
 * The name of a language in that language, with a capital first letter: `English`,
 * `Indonesia`, `Español`. A writer finds a language faster by its own name.
 */
export function languageLabel(tag: string): string {
	const name = languageName({ tag, displayIn: tag });
	// ts-belt has no locale-aware capital letter. The first letter of a name in its own
	// language takes the rules of that language.
	return `${name.charAt(0).toLocaleUpperCase(tag)}${name.slice(1)}`;
}
