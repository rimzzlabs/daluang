import { A, D, pipe } from "@mobily/ts-belt";

/**
 * The security headers of each response of the CMS. The Content Security Policy is not
 * here: Astro sends it with each page, from `CMS_CSP`.
 */
const SECURITY_HEADERS: Readonly<Record<string, string>> = {
	"X-Content-Type-Options": "nosniff",
	// A page of the CMS cannot show in a frame of another site.
	"X-Frame-Options": "DENY",
	// The path of a draft does not go to another site.
	"Referrer-Policy": "same-origin",
	"Cross-Origin-Opener-Policy": "same-origin",
	"Cross-Origin-Resource-Policy": "same-origin",
	"Permissions-Policy":
		"camera=(), microphone=(), geolocation=(), payment=(), usb=()",
	// A search engine does not index the CMS. The site shows the notes.
	"X-Robots-Tag": "noindex, nofollow",
};

const HSTS = "max-age=31536000; includeSubDomains";

/** The security headers for a response to `url`. HTTPS adds `Strict-Transport-Security`. */
export function securityHeaders(url: URL): Readonly<Record<string, string>> {
	if (url.protocol !== "https:") return SECURITY_HEADERS;
	return { ...SECURITY_HEADERS, "Strict-Transport-Security": HSTS };
}

/**
 * A copy of the response with the security headers. A response with no `Cache-Control`
 * gets `no-store`, because a page or an endpoint of the CMS has the data of a signed-in
 * person. The static files do not come through the Worker.
 */
export function withSecurityHeaders(response: Response, url: URL): Response {
	// A copy of the `Headers` object keeps each `Set-Cookie` of a sign-in.
	const headers = new Headers(response.headers);
	pipe(
		securityHeaders(url),
		D.toPairs,
		A.forEach(([name, value]) => {
			headers.set(name, value);
		}),
	);
	if (!headers.has("Cache-Control")) headers.set("Cache-Control", "no-store");
	// A response of `Response.redirect` has headers that cannot change, so this is a copy.
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}
