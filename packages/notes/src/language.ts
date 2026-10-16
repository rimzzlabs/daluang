import { A, O, pipe, R } from "@mobily/ts-belt";
import { z } from "zod";

// Names in English, only to check that the runtime knows a language. `fallback: "none"`
// gives no name for a word that has the form of a tag but is not a language: `english`.
const KNOWN_LANGUAGES = new Intl.DisplayNames(["en"], {
	type: "language",
	fallback: "none",
});

/**
 * The canonical form of a BCP 47 language tag, for example `en-US` for `EN-us`, or `None`
 * for a value that is not the tag of a known language. The `Intl` API of the runtime does
 * the check.
 */
export function canonicalLanguage(tag: string): O.Option<string> {
	return pipe(
		R.fromExecution(() => Intl.getCanonicalLocales(tag.trim())),
		R.toOption,
		O.flatMap(A.head),
		O.filter((canonical) => KNOWN_LANGUAGES.of(canonical) !== undefined),
	);
}

/** A language tag. It accepts a tag in any case and gives its canonical form. */
export const languageTagSchema = z.string().transform((value, context) => {
	const tag = canonicalLanguage(value);
	if (O.isSome(tag)) return tag;
	context.addIssue({
		code: "custom",
		message: `"${value}" is not a language tag. Use a tag such as en, id, or pt-BR.`,
	});
	return z.NEVER;
});

export interface LanguageNameRequest {
	tag: string;
	/** The language of the name, for example `en` for "Indonesian" or `id` for "Indonesia". */
	displayIn: string;
}

/** The name of a language, for a menu or a label. A tag with no known name stays a tag. */
export function languageName(request: LanguageNameRequest): string {
	return pipe(
		R.fromExecution(
			() => new Intl.DisplayNames([request.displayIn], { type: "language" }),
		),
		R.toOption,
		O.flatMap((names) => names.of(request.tag)),
		O.getWithDefault(request.tag),
	);
}
