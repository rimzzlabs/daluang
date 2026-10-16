import {
	SIDEBAR_STATE_KEY,
	SIDEBAR_WIDTH_KEY,
	SIDEBAR_WIDTH_REM,
} from "./sidebar-preferences";
import { THEME_STORAGE_KEY } from "./theme";

/**
 * The inline script for the `<head>` of each app. It applies the saved preferences before
 * the first paint, so a reload or a first visit shows the saved look at once. Put it first
 * in the `<head>`: `<script is:inline set:html={PREFERENCES_SCRIPT} />`.
 *
 * - The theme: the class `dark` and `color-scheme` on `<html>`. With no saved choice, the
 *   theme follows the system.
 * - The sidebar: the server cannot read localStorage, so it renders the default sidebar in
 *   `[data-static-shell]`. The script watches the parser and gives that sidebar its saved
 *   state and width as soon as the parser adds it, before the first paint. The CMS uses
 *   the collapsible mode `icon`.
 */
export const PREFERENCES_SCRIPT = `(function () {
	var root = document.documentElement;
	function read(key) {
		try {
			return localStorage.getItem(key);
		} catch (error) {
			return null;
		}
	}

	var theme = read(${JSON.stringify(THEME_STORAGE_KEY)});
	var dark =
		theme === "dark" ||
		(theme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
	root.classList.toggle("dark", dark);
	root.style.colorScheme = dark ? "dark" : "light";

	var collapsed = read(${JSON.stringify(SIDEBAR_STATE_KEY)}) === "collapsed";
	var width = Number(read(${JSON.stringify(SIDEBAR_WIDTH_KEY)}) || NaN);
	var hasWidth = width >= ${SIDEBAR_WIDTH_REM.min} && width <= ${SIDEBAR_WIDTH_REM.max};
	if (!collapsed && !hasWidth) return;

	var wrapperDone = !hasWidth;
	var sidebarDone = !collapsed;
	// Gives the static shell its saved state. True when there is nothing more to do.
	function apply() {
		if (!wrapperDone) {
			var wrapper = document.querySelector('[data-static-shell] [data-slot="sidebar-wrapper"]');
			if (wrapper) {
				wrapper.style.setProperty("--sidebar-width", width + "rem");
				wrapperDone = true;
			}
		}
		if (!sidebarDone) {
			var sidebar = document.querySelector('[data-static-shell] [data-slot="sidebar"]');
			if (sidebar) {
				sidebar.setAttribute("data-state", "collapsed");
				sidebar.setAttribute("data-collapsible", "icon");
				sidebarDone = true;
			}
		}
		return wrapperDone && sidebarDone;
	}
	var observer = new MutationObserver(function () {
		if (apply()) observer.disconnect();
	});
	observer.observe(root, { childList: true, subtree: true });
	// A last pass when the parser is done, in case a change came after the last callback.
	document.addEventListener("DOMContentLoaded", function () {
		apply();
		observer.disconnect();
	});
})();`;
