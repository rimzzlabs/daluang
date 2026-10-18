import { A } from "@mobily/ts-belt";

/**
 * The number of changes that wait for Publish changes, in the browser. The app island makes
 * one store from the number of the server. A save and a publish write the new number to
 * it, and the navbar renders again.
 */
export interface ChangesStore {
	read: () => number;
	write: (next: number) => void;
	subscribe: (listener: () => void) => () => void;
}

export function createChangesStore(initial: number): ChangesStore {
	let current = initial;
	let listeners: readonly (() => void)[] = [];
	return {
		read: () => current,
		write: (next) => {
			current = next;
			A.forEach(listeners, (listener) => {
				listener();
			});
		},
		subscribe: (listener) => {
			listeners = [...listeners, listener];
			return () => {
				listeners = A.reject(listeners, (item) => item === listener);
			};
		},
	};
}
