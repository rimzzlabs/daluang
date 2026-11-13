import { useEffect, useEffectEvent, useRef } from "react";
import type { AutosaveOutcome } from "@/lib/notes/client";

/** The wait after the last change before a save, in milliseconds. */
export const AUTOSAVE_DELAY_MS = 1000;

/** The wait after a failed save before the hook tries again, in milliseconds. */
export const AUTOSAVE_RETRY_MS = 5000;

export interface Autosave<T> {
	/** Saves the value after the wait. A new value starts the wait again. */
	schedule: (value: T) => void;
	/** Saves the value that is not saved now, with no wait. */
	flush: () => void;
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
	const running = useRef(false);
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
		if (running.current || sent === null) return;
		running.current = true;
		const outcome = await latestSave.current(sent.value);
		running.current = false;
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

	return { schedule, flush };
}
