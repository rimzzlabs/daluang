import { A, O, R } from "@mobily/ts-belt";
import { z } from "zod";
import { type NoteIssue, type NoteSettings, toIssues } from "./api";
import {
	type DraftRules,
	noteDraftSchema,
	publishedDraftSchema,
} from "./note-draft";
import type { ImportedNote, ImportFile } from "./note-import";

// The body that the import dialog sends: one file, and the language of the import.
const importFileSchema: z.ZodType<ImportFile> = z.object({
	fileName: z.string(),
	language: z.string(),
	text: z.string(),
});

/** The rules of a draft from the stored settings, or `None` before the onboarding. */
export function importRules(settings: NoteSettings): O.Option<DraftRules> {
	if (settings.languages === null) return O.None;
	return O.Some({
		languages: settings.languages,
		fields: settings.fields ?? [],
	});
}

/** The file of a request body, or the issues of a body that is not a file. */
export function importFileOf(
	body: unknown,
): R.Result<ImportFile, readonly NoteIssue[]> {
	const parsed = importFileSchema.safeParse(body);
	if (!parsed.success) return R.Error(toIssues(parsed.error));
	return R.Ok(parsed.data);
}

/** An imported note and the settings that its draft must obey. */
export interface ImportCheck {
	imported: ImportedNote;
	rules: DraftRules;
}

/**
 * The imported note with the draft that the settings accept, or the issues of the
 * draft. A language that the CMS does not have is an issue.
 */
export function checkedImport(
	check: ImportCheck,
): R.Result<ImportedNote, readonly NoteIssue[]> {
	const parsed = noteDraftSchema(check.rules).safeParse(check.imported.draft);
	if (!parsed.success) return R.Error(toIssues(parsed.error));
	return R.Ok({ ...check.imported, draft: parsed.data });
}

/**
 * The mark of an imported note: `publish` when the file has `status: published`, the
 * import gave no warning, and each required field has a value. Else `null`: the post
 * stays a plain draft, and the writer publishes it after a check.
 */
export function importMark(check: ImportCheck): "publish" | null {
	const { imported, rules } = check;
	if (!imported.wantsPublish || !A.isEmpty(imported.warnings)) return null;
	const ready = publishedDraftSchema(rules).safeParse(imported.draft).success;
	return ready ? "publish" : null;
}
