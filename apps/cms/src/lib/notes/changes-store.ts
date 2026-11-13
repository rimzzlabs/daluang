import { A } from "@mobily/ts-belt";
import type { AutosaveOutcome } from "./client";

/** Saves the open post before Publish changes. `saved` when the server has its last text. */
export type OpenPostSave = () => Promise<AutosaveOutcome>;

/**
 * The number of changes that wait for Publish changes, in the browser. The app island makes
 * one store from the number of the server. A save and a publish write the new number to
 * it, and the navbar renders again.
 *
 * The store also counts each Publish changes that succeeds (`readPublished`). A page that
 * shows posts reads them again when this number changes. The page of a post registers the
 * save of its form, so Publish changes saves the open post first.
 */
export interface ChangesStore {
	read: () => number;
	write: (next: number) => void;
	/** The number of Publish changes that succeeded since the island opened. */
	readPublished: () => number;
	/** Publish changes succeeded: no change waits, and each page reads its posts again. */
	markPublished: () => void;
	subscribe: (listener: () => void) => () => void;
	/** Registers the save of the open post. The returned function removes it. */
	registerOpenPost: (save: OpenPostSave) => () => void;
	/** Saves the open post. `saved` when no post is open. */
	saveOpenPost: () => Promise<AutosaveOutcome>;
}

export function createChangesStore(initial: number): ChangesStore {
	let current = initial;
	let published = 0;
	let listeners: readonly (() => void)[] = [];
	let openPost: OpenPostSave | null = null;

	function tell() {
		A.forEach(listeners, (listener) => {
			listener();
		});
	}

	return {
		read: () => current,
		write: (next) => {
			current = next;
			tell();
		},
		readPublished: () => published,
		markPublished: () => {
			current = 0;
			published += 1;
			tell();
		},
		subscribe: (listener) => {
			listeners = [...listeners, listener];
			return () => {
				listeners = A.reject(listeners, (item) => item === listener);
			};
		},
		registerOpenPost: (save) => {
			openPost = save;
			return () => {
				// A new page can register before the old page removes its save.
				if (openPost === save) openPost = null;
			};
		},
		saveOpenPost: () =>
			openPost === null
				? Promise.resolve<AutosaveOutcome>("saved")
				: openPost(),
	};
}
