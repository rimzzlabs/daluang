import { useSyncExternalStore } from "react";

const WIDE_QUERY = "(min-width: 80rem)";

function subscribe(onChange: () => void) {
	const query = window.matchMedia(WIDE_QUERY);
	query.addEventListener("change", onChange);
	return () => query.removeEventListener("change", onChange);
}

function readIsWide() {
	return window.matchMedia(WIDE_QUERY).matches;
}

// The server knows no width. A panel that needs a wide screen shows only in the browser.
function readServerIsWide() {
	return false;
}

/** True from the `xl` breakpoint of Tailwind CSS (80rem): a screen with room for 3 columns. */
export function useIsWide() {
	return useSyncExternalStore(subscribe, readIsWide, readServerIsWide);
}
