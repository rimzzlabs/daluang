import { NOTE_BODY_MAX_BYTES } from "@daluang/notes/note-draft";
import { R } from "@mobily/ts-belt";
import { importNoteOfCms } from "./client";
import type { FileFailure } from "./import-messages";
import {
	type ImportRow,
	isToSend,
	type RowChange,
	type RowState,
	stopsRun,
} from "./import-run";

function failed(failure: FileFailure): RowState {
	return { status: "failed", failure };
}

/** One file of an import, and the language of the import. */
export interface FileImport {
	file: File;
	language: string;
}

/**
 * Side effect: reads the file, then sends it to the import endpoint, so the CMS adds the
 * post. A file above the size limit of a post is not read and not sent.
 */
export async function importOneFile(params: FileImport): Promise<RowState> {
	const { file, language } = params;
	if (file.size > NOTE_BODY_MAX_BYTES) return failed({ code: "too-large" });
	const text = await R.fromPromise(file.text());
	if (R.isError(text)) return failed({ code: "file-not-read" });
	const result = await importNoteOfCms({
		fileName: file.name,
		language,
		text: R.getExn(text),
	});
	return R.match(
		result,
		(post): RowState => ({ status: "imported", post }),
		(failure) =>
			failure.code === "slug-taken" ? { status: "skipped" } : failed(failure),
	);
}

export interface FileRun {
	rows: readonly ImportRow[];
	language: string;
	/** Gets each change of a row, so the dialog shows the progress. */
	onRow: (change: RowChange) => void;
	/** False when the dialog went away. The run then sends no more files. */
	shouldContinue: () => boolean;
}

/**
 * Side effect: imports each row that `isToSend` accepts, one file at a time, in the order
 * of the rows. It gives the failure that stopped the run, or `null`.
 */
export async function sendFiles(run: FileRun): Promise<FileFailure | null> {
	// One request at a time keeps the order of the names, and the load of the server low.
	for (const [index, row] of run.rows.entries()) {
		if (!run.shouldContinue()) return null;
		if (!isToSend(row)) continue;
		run.onRow({ index, state: { status: "importing" } });
		const state = await importOneFile({
			file: row.file,
			language: run.language,
		});
		run.onRow({ index, state });
		if (state.status === "failed" && stopsRun(state.failure))
			return state.failure;
	}
	return null;
}
