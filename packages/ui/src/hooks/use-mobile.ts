import { useSyncExternalStore } from "react";

const MOBILE_QUERY = "(max-width: 767px)";

function subscribe(onChange: () => void) {
	const query = window.matchMedia(MOBILE_QUERY);
	query.addEventListener("change", onChange);
	return () => query.removeEventListener("change", onChange);
}

function readIsMobile() {
	return window.matchMedia(MOBILE_QUERY).matches;
}

function readServerIsMobile() {
	return false;
}

/** True below the `md` breakpoint of Tailwind CSS (48rem). */
export function useIsMobile() {
	return useSyncExternalStore(subscribe, readIsMobile, readServerIsMobile);
}
