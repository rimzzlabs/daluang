/** The read speed of the read time, in words for each minute. */
export const WORDS_PER_MINUTE = 200;

/** The numbers of the status bar of the editor. */
export interface BodyStats {
	words: number;
	/** The characters of the body, as a person counts them: one for each code point. */
	characters: number;
	/** The minutes to read the body, rounded up. An empty body takes 0 minutes. */
	readMinutes: number;
}

// A word starts with a letter or a digit. A mark of Markdown alone, such as `#` or `---`,
// is not a word.
const WORD = /[\p{L}\p{N}][\p{L}\p{N}\p{M}'’_-]*/gu;

/** The number of words, of characters, and of read minutes of a Markdown body. */
export function bodyStats(body: string): BodyStats {
	const words = body.match(WORD)?.length ?? 0;
	return {
		words,
		characters: Array.from(body).length,
		readMinutes: Math.ceil(words / WORDS_PER_MINUTE),
	};
}
