import { useEffect, useEffectEvent, useRef } from "react";

/** The wait after the last change before a save, in milliseconds. */
export const AUTOSAVE_DELAY_MS = 1000;

export interface Autosave<T> {
	/** Saves the value after the wait. A new value starts the wait again. */
	schedule: (value: T) => void;
	/** Saves the value that waits now, with no wait. */
	flush: () => void;
}

/**
 * Saves the last value after the writer stops for `AUTOSAVE_DELAY_MS`. One save runs at a
 * time: a change during a save waits, then the next save sends the last value, so an old
 * value never comes after a new one. A value that waits when the component goes away is
 * saved at once, and the browser asks before it closes the page.
 */
export function useAutosave<T>(save: (value: T) => Promise<void>): Autosave<T> {
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const waiting = useRef<{ value: T } | null>(null);
	const running = useRef(false);
	const latestSave = useRef(save);

	// The timer calls the save of the last render, with its last props.
	useEffect(() => {
		latestSave.current = save;
	});

	function stopTimer() {
		if (timer.current !== null) clearTimeout(timer.current);
		timer.current = null;
	}

	async function run() {
		const next = waiting.current;
		if (running.current || next === null) return;
		waiting.current = null;
		running.current = true;
		await latestSave.current(next.value);
		running.current = false;
		// A change came during the save: save it now, because its wait is over or nearly over.
		if (waiting.current !== null && timer.current === null) await run();
	}

	function schedule(value: T) {
		waiting.current = { value };
		stopTimer();
		timer.current = setTimeout(() => {
			timer.current = null;
			run();
		}, AUTOSAVE_DELAY_MS);
	}

	function flush() {
		stopTimer();
		run();
	}

	const leave = useEffectEvent(() => flush());

	// The window is an external system. The effect saves the waiting value when the
	// component goes away, and asks the browser to warn before it closes the page.
	useEffect(() => {
		function warn(event: BeforeUnloadEvent) {
			if (waiting.current !== null || running.current) event.preventDefault();
		}
		window.addEventListener("beforeunload", warn);
		return () => {
			window.removeEventListener("beforeunload", warn);
			leave();
		};
	}, []);

	return { schedule, flush };
}
