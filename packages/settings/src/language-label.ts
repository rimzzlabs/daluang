import { languageName } from "@daluang/notes/language";
import { O, pipe } from "@mobily/ts-belt";

// The data of `Intl` has no name for these languages in the language itself, and gives
// the English name. Daluang names them as their writers do.
const OWN_NAMES: Readonly<Record<string, string>> = {
	su: "Basa Sunda",
	jv: "Basa Jawa",
};

/**
 * The name of a language in that language, with a capital first letter: `English`,
 * `Indonesia`, `Español`. A writer finds a language faster by its own name.
 */
export function languageLabel(tag: string): string {
	const name = pipe(
		O.fromNullable(OWN_NAMES[tag]),
		O.getWithDefault(languageName({ tag, displayIn: tag })),
	);
	// ts-belt has no locale-aware capital letter. The first letter of a name in its own
	// language takes the rules of that language.
	return `${name.charAt(0).toLocaleUpperCase(tag)}${name.slice(1)}`;
}
