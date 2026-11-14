import { A, pipe } from "@mobily/ts-belt";
import type { ImportedPost } from "./client";
import type { FileFailure } from "./import-messages";

/** The state of one file of an import. A `slug-taken` answer skips the file. */
export type RowState =
	| { status: "waiting" }
	| { status: "importing" }
	| { status: "imported"; post: ImportedPost }
	| { status: "skipped" }
	| { status: "failed"; failure: FileFailure };

export interface ImportRow {
	file: File;
	state: RowState;
}

export interface RowChange {
	index: number;
	state: RowState;
}

// Each next file fails in the same way, so the run stops at the file.
const STOP_CODES: readonly FileFailure["code"][] = [
	"signed-out",
	"offline",
	"settings-needed",
];

// A retry can help. Each other failure comes from the file, which does not change. A file
// that the browser cannot read fails again, so the writer chooses it again.
const RETRY_CODES: readonly FileFailure["code"][] = [...STOP_CODES, "server"];

/**
 * One waiting row for each file, in the order of the names. A number in a name counts as
 * a number (`a2.md` before `a10.md`), and capitals do not come first.
 */
export function importRows(files: readonly File[]): readonly ImportRow[] {
	return pipe(
		files,
		A.sort((one, other) =>
			one.name.localeCompare(other.name, undefined, {
				numeric: true,
				sensitivity: "base",
			}),
		),
		A.map((file): ImportRow => ({ file, state: { status: "waiting" } })),
	);
}

/** True when the failure stops the run. */
export function stopsRun(failure: FileFailure): boolean {
	return A.includes(STOP_CODES, failure.code);
}

/** True for a row that the next run sends: a waiting row, or a failure that a retry can help. */
export function isToSend(row: ImportRow): boolean {
	const { state } = row;
	if (state.status === "waiting") return true;
	return (
		state.status === "failed" && A.includes(RETRY_CODES, state.failure.code)
	);
}

export function withRowState(
	rows: readonly ImportRow[],
	change: RowChange,
): readonly ImportRow[] {
	return A.updateAt(rows, change.index, (row) => ({
		...row,
		state: change.state,
	}));
}

/** The number of rows that no run sends again: imported, skipped, or failed for good. */
export function finishedCount(rows: readonly ImportRow[]): number {
	return pipe(
		rows,
		A.filter(
			(row) =>
				row.state.status !== "waiting" &&
				row.state.status !== "importing" &&
				!isToSend(row),
		),
		A.length,
	);
}

export interface ImportSummary {
	imported: number;
	toPublish: number;
	skipped: number;
	failed: number;
	waiting: number;
}

function count(
	rows: readonly ImportRow[],
	test: (state: RowState) => boolean,
): number {
	return pipe(
		rows,
		A.filter((row) => test(row.state)),
		A.length,
	);
}

/** The number of files in each state. `toPublish` counts the imported posts with the mark. */
export function importSummary(rows: readonly ImportRow[]): ImportSummary {
	return {
		imported: count(rows, (state) => state.status === "imported"),
		toPublish: count(
			rows,
			(state) =>
				state.status === "imported" && state.post.note.mark === "publish",
		),
		skipped: count(rows, (state) => state.status === "skipped"),
		failed: count(rows, (state) => state.status === "failed"),
		waiting: count(
			rows,
			(state) => state.status === "waiting" || state.status === "importing",
		),
	};
}

/** The summary as one line, for example `12 imported, 1 skipped, 0 failed.` */
export function importSummaryText(summary: ImportSummary): string {
	const waiting =
		summary.waiting === 0 ? "" : `, ${summary.waiting} not imported yet`;
	return `${summary.imported} imported, ${summary.skipped} skipped, ${summary.failed} failed${waiting}. ${summary.toPublish} with the mark To publish.`;
}
