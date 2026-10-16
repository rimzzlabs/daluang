/** The cookie that keeps the open state of the sidebar: `true` or `false`. */
export const SIDEBAR_STATE_COOKIE = "sidebar_state";

/** The cookie that keeps the width of the expanded sidebar, in rem. */
export const SIDEBAR_WIDTH_COOKIE = "sidebar_width";

/** The width of the expanded sidebar, in rem. A drag stays between `min` and `max`. */
export const SIDEBAR_WIDTH_REM = { default: 16, min: 13, max: 24 } as const;

export function clampSidebarWidth(rem: number): number {
	const clamped = Math.min(
		SIDEBAR_WIDTH_REM.max,
		Math.max(SIDEBAR_WIDTH_REM.min, rem),
	);
	return Math.round(clamped * 100) / 100;
}

/** Reads the state cookie on the server. A missing or unknown value is open. */
export function parseSidebarOpen(value: string | undefined): boolean {
	return value !== "false";
}

/** Reads the width cookie on the server. A missing or wrong value is the default width. */
export function parseSidebarWidth(value: string | undefined): number {
	const rem = Number(value);
	if (value === undefined || !Number.isFinite(rem))
		return SIDEBAR_WIDTH_REM.default;
	return clampSidebarWidth(rem);
}
