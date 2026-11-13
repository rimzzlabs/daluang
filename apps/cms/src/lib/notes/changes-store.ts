import { A } from "@mobily/ts-belt";

/**
 * The number of changes that wait for Publish changes, in the browser. The app island makes
 * one store from the number of the server. A save and a publish write the new number to
 * it, and the navbar renders again.
 *
 * The store also counts each Publish changes that succeeds (`readPublished`). A page that
 * shows posts reads them again when this number changes.
 */
export interface ChangesStore {
	read: () => number;
	write: (next: number) => void;
	/** The number of Publish changes that succeeded since the island opened. */
	readPublished: () => number;
	/** Publish changes succeeded: no change waits, and each page reads its posts again. */
	markPublished: () => void;
	subscribe: (listener: () => void) => () => void;
}

export function createChangesStore(initial: number): ChangesStore {
	let current = initial;
	let published = 0;
	let listeners: readonly (() => void)[] = [];

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
	};
}
