import { useEffect, useEffectEvent, useRef } from "react";
import type { AutosaveOutcome } from "@/lib/notes/client";

/** The wait after the last change before a save, in milliseconds. */
export const AUTOSAVE_DELAY_MS = 1000;

/** The wait after a failed save before the hook tries again, in milliseconds. */
export const AUTOSAVE_RETRY_MS = 5000;

/** `AUTOSAVE_RETRY_MS` in seconds, for a message. */
export const AUTOSAVE_RETRY_SECONDS = AUTOSAVE_RETRY_MS / 1000;

/** The save that runs now: the value that it sent, and its outcome. */
interface RunningSave<T> {
	sent: { value: T };
	saving: Promise<AutosaveOutcome>;
}

export interface Autosave<T> {
	/** Saves the value after the wait. A new value starts the wait again. */
	schedule: (value: T) => void;
	/** Saves the value that is not saved now, with no wait. */
	flush: () => void;
	/** True while the server does not have the last value, also during its save. */
	hasUnsaved: () => boolean;
	/**
	 * Saves the value that is not saved now, with no wait, and waits for each save. Gives
	 * `saved` when the server has the last value, else the outcome of its last save.
	 */
	settle: () => Promise<AutosaveOutcome>;
}

/**
 * Saves the last value after the writer stops for `AUTOSAVE_DELAY_MS`. One save runs at a
 * time: a change during a save waits, then the next save sends the last value, so an old
 * value never comes after a new one. The hook keeps a value until a save of it succeeds.
 * After a failed save, it tries again after `AUTOSAVE_RETRY_MS`. After a refused save, it
 * waits for the next change. A value that is not saved when the component goes away is
 * sent at once, and the browser asks before it closes the page.
 */
export function useAutosave<T>(
	save: (value: T) => Promise<AutosaveOutcome>,
): Autosave<T> {
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	// The last value that the server does not have. A new object for each change, so a save
	// knows if a newer change came during it.
	const unsaved = useRef<{ value: T } | null>(null);
	const running = useRef<RunningSave<T> | null>(null);
	const lastOutcome = useRef<AutosaveOutcome>("saved");
	const gone = useRef(false);
	const latestSave = useRef(save);

	// The timer calls the save of the last render, with its last props.
	useEffect(() => {
		latestSave.current = save;
	});

	function stopTimer() {
		if (timer.current !== null) clearTimeout(timer.current);
		timer.current = null;
	}

	function start(wait: number) {
		stopTimer();
		timer.current = setTimeout(() => {
			timer.current = null;
			run();
		}, wait);
	}

	async function run() {
		const sent = unsaved.current;
		if (running.current !== null || sent === null) return;
		const saving = latestSave.current(sent.value);
		running.current = { sent, saving };
		const outcome = await saving;
		running.current = null;
		lastOutcome.current = outcome;
		if (unsaved.current === sent) {
			if (outcome === "saved") unsaved.current = null;
			// A page that went away does not try again in the background.
			if (outcome === "failed" && !gone.current) start(AUTOSAVE_RETRY_MS);
			return;
		}
		// A change came during the save: save it now, because its wait is over or nearly over.
		if (timer.current === null) await run();
	}

	function schedule(value: T) {
		unsaved.current = { value };
		start(AUTOSAVE_DELAY_MS);
	}

	function flush() {
		stopTimer();
		run();
	}

	function hasUnsaved() {
		return unsaved.current !== null;
	}

	async function settle(): Promise<AutosaveOutcome> {
		const before = unsaved.current;
		if (before === null) return "saved";
		const active = running.current;
		if (active === null) {
			stopTimer();
			await run();
		} else {
			await active.saving;
		}
		if (unsaved.current === null) return "saved";
		const sentLast = active === null || active.sent === before;
		// The server did not save the last value. A failed save tries again after its wait.
		if (sentLast && unsaved.current === before) return lastOutcome.current;
		// A newer value came during the save, or waited behind it.
		return settle();
	}

	const leave = useEffectEvent(() => {
		gone.current = true;
		flush();
	});

	// The window is an external system. The effect sends the value that is not saved when
	// the component goes away, and asks the browser to warn before it closes the page.
	useEffect(() => {
		gone.current = false;
		function warn(event: BeforeUnloadEvent) {
			if (unsaved.current !== null) event.preventDefault();
		}
		window.addEventListener("beforeunload", warn);
		return () => {
			window.removeEventListener("beforeunload", warn);
			leave();
		};
	}, []);

	return { schedule, flush, hasUnsaved, settle };
}
