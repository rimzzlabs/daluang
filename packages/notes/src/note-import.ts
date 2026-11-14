import { A, O, pipe, R, S } from "@mobily/ts-belt";
import {
	type FileParts,
	type FrontmatterError,
	readFrontmatter,
} from "./frontmatter";
import { importDate } from "./import-date";
import {
	type FieldLeftOut,
	importFields,
	importKeywords,
	isPresent,
	textOf,
} from "./import-fields";
import { mdxToComark } from "./mdx-to-comark";
import type { NoteDraft } from "./note";
import { UNTITLED_SLUG } from "./note-draft";
import { slugify, slugSchema } from "./slug";

/** One file that the writer chose: its name, its text, and the language of the import. */
export interface ImportFile {
	fileName: string;
	text: string;
	language: string;
}

type DateKey = "publishedAt" | "updatedAt";

export type ImportWarning =
	| { code: "date-not-read"; name: DateKey }
	| FieldLeftOut
	| { code: "component-kept"; name: string; count: number };

/** Why a file cannot become a draft. The UI shows one message for each code. */
export type ImportError = FrontmatterError | "no-title";

export interface ImportedNote {
	/** The draft, not yet checked against the settings of the CMS. */
	draft: NoteDraft;
	/** The ISO time of the first publish from the frontmatter, or `null`. */
	publishedAt: string | null;
	/** The ISO time of the last change: `updatedAt`, else `publishedAt`, else `null`. */
	updatedAt: string | null;
	/** True when the frontmatter has `status: published`. */
	wantsPublish: boolean;
	/** The dates, then the fields, then the components. */
	warnings: readonly ImportWarning[];
}

type Frontmatter = Record<string, unknown>;

function fileBaseName(fileName: string): string {
	return pipe(
		fileName,
		S.splitByRe(/[\\/]/),
		A.last,
		O.getWithDefault(""),
		S.replaceByRe(/\.mdx?$/i, ""),
	);
}

interface SlugSource {
	fileName: string;
	frontmatter: Frontmatter;
	title: string;
}

/** The slug of the frontmatter, else of the file name, else of the title, else `untitled`. */
function importSlug(source: SlugSource): string {
	const candidates = [
		pipe(source.frontmatter.slug, textOf, O.getWithDefault("")),
		fileBaseName(source.fileName),
		source.title,
	];
	return pipe(
		candidates,
		A.map((text) =>
			slugSchema.safeParse(text).success ? text : slugify(text),
		),
		A.find((slug) => !S.isEmpty(slug)),
		O.getWithDefault(UNTITLED_SLUG),
	);
}

interface DateRead {
	date: string | null;
	warnings: readonly ImportWarning[];
}

function readDate(frontmatter: Frontmatter, name: DateKey): DateRead {
	const value = frontmatter[name];
	const date = O.toNullable(importDate(value));
	const lost = date === null && isPresent(value);
	return { date, warnings: lost ? [{ code: "date-not-read", name }] : [] };
}

function keptWarnings(kept: readonly string[]): readonly ImportWarning[] {
	return pipe(
		kept,
		A.uniq,
		A.map((name): ImportWarning => {
			const count = pipe(
				kept,
				A.filter((use) => use === name),
				A.length,
			);
			return { code: "component-kept", name, count };
		}),
	);
}

interface Source {
	file: ImportFile;
	parts: FileParts;
}

function noteOf(source: Source): R.Result<ImportedNote, ImportError> {
	const { file, parts } = source;
	const { frontmatter } = parts;
	const title = textOf(frontmatter.title);
	if (!O.isSome(title)) return R.Error("no-title");
	const published = readDate(frontmatter, "publishedAt");
	const updated = readDate(frontmatter, "updatedAt");
	const extra = importFields(frontmatter);
	const comark = mdxToComark(parts.body);
	return R.Ok({
		draft: {
			title,
			slug: importSlug({ fileName: file.fileName, frontmatter, title }),
			language: file.language,
			description: pipe(frontmatter.description, textOf, O.getWithDefault("")),
			keywords: importKeywords(frontmatter.keywords),
			fields: extra.fields,
			// `readFrontmatter` and `mdxToComark` keep the empty line before a `---` at the start.
			body: comark.body,
		},
		publishedAt: published.date,
		updatedAt: updated.date ?? published.date,
		wantsPublish: pipe(
			frontmatter.status,
			textOf,
			O.mapWithDefault(
				false,
				(status) => S.toLowerCase(status) === "published",
			),
		),
		warnings: [
			...published.warnings,
			...updated.warnings,
			...extra.warnings,
			...keptWarnings(comark.kept),
		],
	});
}

/**
 * Turns the text of one Markdown or MDX file into the data of a draft. The draft is not
 * checked against the settings of the CMS. It never throws.
 */
export async function importedNote(
	file: ImportFile,
): Promise<R.Result<ImportedNote, ImportError>> {
	const read: R.Result<FileParts, ImportError> = await readFrontmatter(
		file.text,
	);
	return R.flatMap(read, (parts) => noteOf({ file, parts }));
}
