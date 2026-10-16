import { THEME_STORAGE_KEY } from "./theme";

/**
 * The inline script for the `<head>` of each app. It applies the saved preferences before
 * the first paint, so a reload or a first visit shows the right theme at once. Put it
 * first in the `<head>`: `<script is:inline set:html={PREFERENCES_SCRIPT} />`.
 *
 * With no saved choice, the theme follows the system. `color-scheme` also sets the theme
 * of the scrollbars and the form controls of the browser.
 */
export const PREFERENCES_SCRIPT = `(function () {
	var root = document.documentElement;
	var theme = null;
	try {
		theme = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
	} catch (error) {}
	var dark =
		theme === "dark" ||
		(theme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
	root.classList.toggle("dark", dark);
	root.style.colorScheme = dark ? "dark" : "light";
})();`;
