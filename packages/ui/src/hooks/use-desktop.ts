import { useSyncExternalStore } from "react";

const DESKTOP_QUERY = "(min-width: 64rem)";

function subscribe(onChange: () => void) {
	const query = window.matchMedia(DESKTOP_QUERY);
	query.addEventListener("change", onChange);
	return () => query.removeEventListener("change", onChange);
}

function readIsDesktop() {
	return window.matchMedia(DESKTOP_QUERY).matches;
}

// The server knows no width. A dialog is closed at the first render, so the guess shows
// nothing.
function readServerIsDesktop() {
	return false;
}

/** True from the `lg` breakpoint of Tailwind CSS (64rem): a desktop, not a phone or a tablet. */
export function useIsDesktop() {
	return useSyncExternalStore(subscribe, readIsDesktop, readServerIsDesktop);
}
