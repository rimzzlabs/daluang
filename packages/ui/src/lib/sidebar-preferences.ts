/** The localStorage key of the open state of the sidebar: `expanded` or `collapsed`. */
export const SIDEBAR_STATE_KEY = "daluang:sidebar-state";

/** The localStorage key of the width of the expanded sidebar, in rem. */
export const SIDEBAR_WIDTH_KEY = "daluang:sidebar-width";

/** The width of the expanded sidebar, in rem. A drag stays between `min` and `max`. */
export const SIDEBAR_WIDTH_REM = { default: 16, min: 13, max: 24 } as const;

export interface SidebarPreferences {
	open: boolean;
	/** In rem. */
	width: number;
}

export function clampSidebarWidth(rem: number): number {
	const clamped = Math.min(
		SIDEBAR_WIDTH_REM.max,
		Math.max(SIDEBAR_WIDTH_REM.min, rem),
	);
	return Math.round(clamped * 100) / 100;
}

/** Reads a stored state. A missing or unknown value is open. */
export function parseSidebarOpen(value: string | null): boolean {
	return value !== "collapsed";
}

/** Reads a stored width. A missing or wrong value is the default width. */
export function parseSidebarWidth(value: string | null): number {
	const rem = Number(value);
	if (value === null || value === "" || !Number.isFinite(rem))
		return SIDEBAR_WIDTH_REM.default;
	return clampSidebarWidth(rem);
}

function readItem(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		// The browser blocks storage. The sidebar then has its default state.
		return null;
	}
}

/** The stored preferences of the sidebar, in the browser. `PREFERENCES_SCRIPT` reads the same keys. */
export function readSidebarPreferences(): SidebarPreferences {
	return {
		open: parseSidebarOpen(readItem(SIDEBAR_STATE_KEY)),
		width: parseSidebarWidth(readItem(SIDEBAR_WIDTH_KEY)),
	};
}

export interface SidebarPreferenceWrite {
	key: typeof SIDEBAR_STATE_KEY | typeof SIDEBAR_WIDTH_KEY;
	value: string;
}

export function writeSidebarPreference(write: SidebarPreferenceWrite) {
	try {
		localStorage.setItem(write.key, write.value);
	} catch {
		// The browser blocks storage. The change then lasts until the next page load.
	}
}
