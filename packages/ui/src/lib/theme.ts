/** The color theme of the page. The class `dark` on `<html>` selects the dark tokens. */
export type Theme = "light" | "dark";

/** The key of the stored choice. The inline script in the layout of each app reads it. */
export const THEME_STORAGE_KEY = "theme";

export function readTheme(): Theme {
	return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function subscribeTheme(onChange: () => void) {
	const observer = new MutationObserver(onChange);
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});
	return () => observer.disconnect();
}

export function writeTheme(theme: Theme) {
	document.documentElement.classList.toggle("dark", theme === "dark");
	try {
		localStorage.setItem(THEME_STORAGE_KEY, theme);
	} catch {
		// The browser blocks storage. The theme then applies until the next page load.
	}
}
