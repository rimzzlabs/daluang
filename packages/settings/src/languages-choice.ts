import { canonicalLanguage } from "@daluang/notes/language";
import type { LanguagesSetting } from "@daluang/notes/languages-setting";
import { A, O, pipe, R } from "@mobily/ts-belt";

/**
 * The languages that a writer chose, and the language of a new note. It has the shape of
 * `LanguagesSetting`, before the schema checks it.
 */
export type LanguagesChoice = LanguagesSetting;

/**
 * The choice after the writer selects `languages`. The writer cannot remove the last
 * language. When the default language leaves the list, the first language takes its place.
 */
export function chooseLanguages(
	choice: LanguagesChoice,
	languages: readonly string[],
): LanguagesChoice {
	if (A.isEmpty(languages)) return choice;
	if (A.includes(languages, choice.defaultLanguage))
		return { ...choice, languages: [...languages] };
	return {
		languages: [...languages],
		defaultLanguage: pipe(
			languages,
			A.head,
			O.getWithDefault(choice.defaultLanguage),
		),
	};
}

export type AddLanguageError = "not-a-language";

/** The choice with one more language, from a tag that the writer types: `pt-BR`. */
export function addLanguage(
	choice: LanguagesChoice,
	tag: string,
): R.Result<LanguagesChoice, AddLanguageError> {
	return pipe(
		canonicalLanguage(tag),
		O.toResult<string, AddLanguageError>("not-a-language"),
		R.map((canonical) => {
			if (A.includes(choice.languages, canonical)) return choice;
			return { ...choice, languages: [...choice.languages, canonical] };
		}),
	);
}

export interface LanguageOptionsRequest {
	common: readonly string[];
	chosen: readonly string[];
}

/** The languages to show as choices: the common ones, then each other one of the choice. */
export function languageOptions(
	params: LanguageOptionsRequest,
): readonly string[] {
	return A.uniq([...params.common, ...params.chosen]);
}
