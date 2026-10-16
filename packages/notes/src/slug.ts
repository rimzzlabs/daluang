import { pipe, S } from "@mobily/ts-belt";
import { z } from "zod";

export const SLUG_MAX_LENGTH = 100;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The slug of a note: the last part of its URL, for example `my-first-note`. */
export const slugSchema = z
	.string()
	.max(
		SLUG_MAX_LENGTH,
		`Keep the slug at ${SLUG_MAX_LENGTH} characters or fewer.`,
	)
	.regex(
		SLUG_PATTERN,
		"Use lowercase letters, digits, and single hyphens: my-first-note.",
	);

/**
 * Makes a slug from a title: lowercase, no accents, and a hyphen between words. A title
 * with no letter or digit gives an empty slug, and the writer types one.
 */
export function slugify(title: string): string {
	// `normalize` splits a letter from its accent. ts-belt has no such function.
	const decomposed = title.normalize("NFKD");
	return pipe(
		decomposed,
		S.replaceByRe(/[̀-ͯ]/g, ""),
		S.toLowerCase,
		S.replaceByRe(/[^a-z0-9]+/g, "-"),
		S.replaceByRe(/^-+|-+$/g, ""),
		S.slice(0, SLUG_MAX_LENGTH),
		S.replaceByRe(/-+$/, ""),
	);
}
