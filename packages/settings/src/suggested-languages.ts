import { canonicalLanguage } from "@daluang/notes/language";
import type { LanguagesSetting } from "@daluang/notes/languages-setting";
import { A, O, pipe, S } from "@mobily/ts-belt";

/**
 * The languages that the onboarding and the languages page show as choices: the most used
 * languages, by the number of speakers. A writer types the tag of each other language.
 */
export const COMMON_LANGUAGES = [
	"en",
	"zh",
	"es",
	"hi",
	"ar",
	"pt",
	"fr",
	"ru",
	"ja",
	"de",
	"id",
	"ko",
] as const;

const SUGGESTIONS_MAX = 3;

interface WeightedTag {
	tag: string;
	weight: number;
}

/** One entry of `Accept-Language`, for example `id;q=0.8`. A missing weight is 1. */
function parseEntry(entry: string): O.Option<WeightedTag> {
	const [tag = "", ...parameters] = pipe(entry, S.split(";"), A.map(S.trim));
	if (S.isEmpty(tag) || tag === "*") return O.None;
	const weight = pipe(
		parameters,
		A.find((parameter) => S.startsWith(parameter, "q=")),
		O.map((parameter) => Number(S.sliceToEnd(parameter, 2))),
		O.getWithDefault(1),
	);
	if (!Number.isFinite(weight) || weight <= 0) return O.None;
	return O.Some({ tag, weight });
}

/**
 * The languages to suggest at the first sign-in, from the `Accept-Language` header of the
 * browser: up to three, the language of the browser first. The suggestion keeps the main
 * language of a tag: `en` for `en-US`. With no known language, it suggests `en`.
 */
export function suggestLanguages(
	acceptLanguage: string | null,
): readonly string[] {
	const suggestions = pipe(
		acceptLanguage ?? "",
		S.split(","),
		A.filterMap(parseEntry),
		A.sortBy((entry) => -entry.weight),
		A.filterMap((entry) =>
			pipe(entry.tag, S.split("-"), A.head, O.flatMap(canonicalLanguage)),
		),
		A.uniq,
		A.take(SUGGESTIONS_MAX),
	);
	if (A.isEmpty(suggestions)) return ["en"];
	return suggestions;
}

export interface InitialLanguagesRequest {
	stored: LanguagesSetting | null;
	acceptLanguage: string | null;
}

/**
 * The languages that the onboarding shows as chosen: the stored ones, or the suggestion
 * from the browser.
 */
export function initialLanguages(
	request: InitialLanguagesRequest,
): LanguagesSetting {
	if (request.stored !== null) return request.stored;
	const suggestions = suggestLanguages(request.acceptLanguage);
	return {
		languages: [...suggestions],
		defaultLanguage: pipe(suggestions, A.head, O.getWithDefault("en")),
	};
}
