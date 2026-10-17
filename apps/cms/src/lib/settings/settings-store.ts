import type { CmsSettings } from "@daluang/settings/settings";
import { A } from "@mobily/ts-belt";
import { useSyncExternalStore } from "react";

/**
 * The settings in the browser. The app island makes one store from the settings of the
 * server. A save writes the new settings to it, and each part that reads it renders again:
 * the sidebar shows a new site name at once.
 */
export interface SettingsStore {
	read: () => CmsSettings;
	write: (next: CmsSettings) => void;
	subscribe: (listener: () => void) => () => void;
}

export function createSettingsStore(initial: CmsSettings): SettingsStore {
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

/** The settings of a store. The component renders again after each write. */
export function useSettings(store: SettingsStore): CmsSettings {
	return useSyncExternalStore(store.subscribe, store.read, store.read);
}
