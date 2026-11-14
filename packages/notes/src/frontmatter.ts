import { R, S } from "@mobily/ts-belt";
import { parseMarkdown } from "comark";

/** The parts of a file: the data of its YAML frontmatter, and the Markdown body after it. */
export interface FileParts {
	frontmatter: Record<string, unknown>;
	body: string;
}

/** The YAML of the frontmatter does not parse, or it is not a set of keys. */
export type FrontmatterError = "frontmatter-not-read";

const OPENING_LINE = /^---[ \t]*\r?\n/;
/** Each regular expression has no `m` flag, because `^` and `$` then also match at `\r`. */
const CLOSING_LINE = /\n---[ \t]*(?:\r?\n|$)/;
/** Comark ends a frontmatter at a line that starts with `---`. YAML reads it as a new document. */
const DOCUMENT_MARKER = /(?:^|\n)---/;
const BLANK_LINES = /^(?:[ \t]*\r?\n)+/;

/**
 * Comark reads a body that starts with `---` as frontmatter, so the text after it goes away
 * from the sites. With one empty line first, Comark reads the `---` as a rule.
 */
function storedBody(text: string): string {
	const body = S.replaceByRe(text, BLANK_LINES, "");
	return S.startsWith(body, "---") ? `\n${body}` : body;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (typeof value !== "object" || value === null || Array.isArray(value))
		return false;
	return Object.getPrototypeOf(value) === Object.prototype;
}

async function parseYaml(
	yaml: string,
): Promise<R.Result<unknown, FrontmatterError>> {
	if (DOCUMENT_MARKER.test(yaml)) return R.Error("frontmatter-not-read");
	try {
		const document = await parseMarkdown(`---\n${yaml}\n---\n`);
		return R.Ok(document.frontmatter);
	} catch {
		return R.Error("frontmatter-not-read");
	}
}

/**
 * Reads the YAML frontmatter of a Markdown or MDX file, and gives the body after it. A file
 * with no frontmatter gives an empty frontmatter and the whole text as the body. It never
 * throws, and it does not parse the body.
 */
export async function readFrontmatter(
	text: string,
): Promise<R.Result<FileParts, FrontmatterError>> {
	const content = S.replaceByRe(text, /^\uFEFF/, "");
	const whole: FileParts = { frontmatter: {}, body: storedBody(content) };
	const opening = OPENING_LINE.exec(content);
	if (opening === null) return R.Ok(whole);
	// The search starts at the line ending of the opening line, so an empty block closes.
	const rest = S.sliceToEnd(content, S.length(opening[0]) - 1);
	const closing = CLOSING_LINE.exec(rest);
	if (closing === null) return R.Ok(whole);
	const parsed = await parseYaml(S.slice(rest, 1, closing.index));
	return R.flatMap(parsed, (frontmatter) => {
		if (!isPlainObject(frontmatter)) return R.Error("frontmatter-not-read");
		return R.Ok({
			// `Object.fromEntries` makes a key such as `__proto__` an own key of a new object.
			// An assignment, as in `D.fromPairs`, changes the prototype of the object.
			frontmatter: Object.fromEntries(Object.entries(frontmatter)),
			body: storedBody(
				S.sliceToEnd(rest, closing.index + S.length(closing[0])),
			),
		});
	});
}
