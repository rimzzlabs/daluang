export const prerender = false;

/**
 * Each path below `/api/` that no endpoint has. It answers 404 as JSON, so a `fetch` of the
 * app reads a failure. Without this route, the page `[...path].astro` answers with HTML.
 * The endpoints of the domains have longer paths, so Astro gives them their requests.
 */
export function ALL(): Response {
	return Response.json({ error: "not-found" }, { status: 404 });
}
