import { A, D, O, pipe, S } from "@mobily/ts-belt";

/**
 * The pages of the app island. The router, the menus, and the Astro page read this list. A
 * segment that starts with `$` is a parameter, as in the paths of TanStack Router.
 */
export const APP_PAGES = [
	{ path: "/", title: "Dashboard" },
	{ path: "/posts", title: "Posts" },
	{ path: "/posts/new", title: "New post" },
	{ path: "/posts/$id", title: "Edit post" },
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

/**
 * True when a path is a path of a page. A parameter of the page matches one segment that is
 * not empty.
 */
export function matchesPage(pagePath: string, path: string): boolean {
	const pageSegments = S.split(pagePath, "/");
	const segments = S.split(path, "/");
	if (A.length(pageSegments) !== A.length(segments)) return false;
	return pipe(
		A.zip(pageSegments, segments),
		A.every(([pageSegment, segment]) =>
			S.startsWith(pageSegment, "$")
				? !S.isEmpty(segment)
				: pageSegment === segment,
		),
	);
}

/**
 * The value of each parameter of a page in a path: `{ id: "n1" }` for `/posts/$id` and
 * `/posts/n1`. A path that does not match the page gives no value.
 */
export function pageParams(
	pagePath: string,
	path: string,
): Record<string, string> {
	const normalized = normalizePath(path);
	if (!matchesPage(pagePath, normalized)) return {};
	return pipe(
		A.zip(S.split(pagePath, "/"), S.split(normalized, "/")),
		A.filter(([pageSegment]) => S.startsWith(pageSegment, "$")),
		A.map(
			([pageSegment, segment]) =>
				[S.sliceToEnd(pageSegment, 1), segment] as const,
		),
		D.fromPairs,
	);
}

/**
 * The page of a path, or `None` for a path with no page in the app island. A page with no
 * parameter comes first in `APP_PAGES`, so `/posts/new` is not a post with the ID `new`.
 */
export function findAppPage(pathname: string): O.Option<AppPage> {
	const path = normalizePath(pathname);
	return A.find(APP_PAGES, (page) => matchesPage(page.path, path));
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
