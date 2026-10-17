import { A, O, pipe } from "@mobily/ts-belt";

/** The pages of the app island. The router, the menus, and the Astro page read this list. */
export const APP_PAGES = [
	{ path: "/", title: "Posts" },
	{ path: "/media", title: "Media" },
	{ path: "/settings/api-tokens", title: "API tokens" },
	{ path: "/settings/webhooks", title: "Webhooks" },
	{ path: "/settings/site", title: "Site" },
	{ path: "/settings/languages", title: "Languages" },
	{ path: "/settings/fields", title: "Fields" },
] as const;

export type AppPagePath = (typeof APP_PAGES)[number]["path"];

export const NOT_FOUND_TITLE = "Page not found";

/** The path with no trailing slash, as the router reads it. `/` stays `/`. */
export function normalizePath(pathname: string): string {
	if (pathname === "/" || !pathname.endsWith("/")) return pathname;
	return normalizePath(pathname.slice(0, -1));
}

export type AppPage = (typeof APP_PAGES)[number];

/** The page of a path, or `None` for a path with no page in the app island. */
export function findAppPage(pathname: string): O.Option<AppPage> {
	const path = normalizePath(pathname);
	return A.find(APP_PAGES, (page) => page.path === path);
}

/** The title of the page of a path, for the navbar. A path with no page has its own title. */
export function pageTitle(pathname: string): string {
	return pipe(
		findAppPage(pathname),
		O.mapWithDefault(NOT_FOUND_TITLE, (page) => page.title),
	);
}

/** The text of `<title>` for a page. */
export function documentTitle(title: string): string {
	return `${title} · Daluang`;
}
