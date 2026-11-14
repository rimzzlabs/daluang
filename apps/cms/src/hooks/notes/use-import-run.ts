import { R } from "@mobily/ts-belt";
import { useEffect, useRef, useState } from "react";
import type { FileFailure } from "@/lib/notes/import-messages";
import {
	type ImportRow,
	importRows,
	withRowState,
} from "@/lib/notes/import-run";
import { sendFiles } from "@/lib/notes/import-send";

/** The state of the import: no run yet, a run, a run that stopped at a failure, or the end. */
export type RunState =
	| { status: "idle" }
	| { status: "running" }
	| { status: "stopped"; failure: FileFailure }
	| { status: "done" };

export interface ImportRunHandle {
	rows: readonly ImportRow[];
	run: RunState;
	/** Gives the chosen files. Only before the first run. */
	choose: (files: readonly File[]) => void;
	/** Sends each file that is not imported, in the language of the import. */
	start: (language: string) => Promise<void>;
}

/**
 * The import of the chosen files, one file at a time. A second start during a run does
 * nothing. After each run, `onImported` reads the posts again. When the component goes
 * away, the run sends no more files.
 */
export function useImportRun(onImported: () => Promise<void>): ImportRunHandle {
	const [rows, setRows] = useState<readonly ImportRow[]>([]);
	const [run, setRun] = useState<RunState>({ status: "idle" });
	// The state of a render comes late, so two fast clicks can both see "idle".
	const running = useRef(false);
	const alive = useRef(true);

	// The run sends requests to the server. When the page goes away, the run must stop.
	useEffect(() => {
		alive.current = true;
		return () => {
			alive.current = false;
		};
	}, []);

	function choose(files: readonly File[]) {
		if (run.status !== "idle") return;
		setRows(importRows(files));
	}

	async function start(language: string) {
		if (running.current) return;
		running.current = true;
		setRun({ status: "running" });
		try {
			const stop = await sendFiles({
				rows,
				language,
				onRow: (change) => setRows((shown) => withRowState(shown, change)),
				shouldContinue: () => alive.current,
			});
			// A failed read keeps the list of the page. The next action reads it again.
			await R.fromPromise(onImported());
			setRun(
				stop === null
					? { status: "done" }
					: { status: "stopped", failure: stop },
			);
		} finally {
			running.current = false;
		}
	}

	return { rows, run, choose, start };
}
