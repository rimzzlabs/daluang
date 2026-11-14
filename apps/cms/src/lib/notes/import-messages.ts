import type { NoteIssue } from "@daluang/notes/api";
import type { FieldDefinition } from "@daluang/notes/field-definitions";
import { NOTE_BODY_MAX_BYTES } from "@daluang/notes/note-draft";
import { issueLabel } from "@daluang/notes/note-form";
import type { ImportWarning } from "@daluang/notes/note-import";
import { A } from "@mobily/ts-belt";
import { match } from "ts-pattern";
import type { ImportFailure } from "./client";

/** Why one file of an import failed: a failure of the request, or a file that the browser cannot read. */
export type FileFailure = ImportFailure | { code: "file-not-read" };

const LIMIT_MB = NOTE_BODY_MAX_BYTES / 1_000_000;

const FAILURE_MESSAGES: Record<FileFailure["code"], string> = {
	"frontmatter-not-read":
		"Daluang cannot read the frontmatter. Correct the YAML.",
	"no-title": 'The frontmatter has no title. Add the key "title".',
	"invalid-note":
		"Daluang cannot keep a value of the file. Correct each value in this list.",
	"slug-taken": "A post with this slug is in this language already.",
	"too-large": `The file is too large to send. The limit of a post is ${LIMIT_MB} MB.`,
	"file-not-read":
		"Daluang cannot read the file. Select Done, open Import again, and choose the file.",
	"settings-needed":
		"Choose the languages of the CMS first. Open Settings, then Languages.",
	"signed-out":
		"Your session ended. Sign in again in another tab, then select Import to continue.",
	offline:
		"Daluang cannot reach the server. Check your connection, then select Import to continue.",
	server: "The server cannot import the file. Select Import to try again.",
};

/** The message of a failed file. An `invalid-note` adds the message of each issue. */
export function importFailureMessage(failure: FileFailure): string {
	return FAILURE_MESSAGES[failure.code];
}

/** The message of each issue of a refused draft, with the label of its input. */
export function importIssueMessages(
	issues: readonly NoteIssue[],
	fields: readonly FieldDefinition[],
): readonly string[] {
	return A.map(issues, (issue) => {
		const label = issueLabel(issue.path, fields);
		return label === "" ? issue.message : `${label}: ${issue.message}`;
	});
}

/** The message of one warning of an imported file. */
export function importWarningMessage(warning: ImportWarning): string {
	return match(warning)
		.with({ code: "component-kept" }, (kept) => {
			const uses = kept.count === 1 ? "1 use" : `${kept.count} uses`;
			return `The component ${kept.name} stays as it is (${uses}). Change it by hand.`;
		})
		.with(
			{ code: "field-left-out" },
			(left) =>
				`The import left out the key "${left.name}". If the post needs the value, add it by hand.`,
		)
		.with(
			{ code: "date-not-read" },
			(date) =>
				`The import cannot read "${date.name}", so the post has no such date. Correct the file, delete the post, and import the file again.`,
		)
		.exhaustive();
}
