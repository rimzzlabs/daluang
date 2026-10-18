import { A, S } from "@mobily/ts-belt";
import { isContentApiPath, SIGN_IN_PATH, signInUrl } from "./paths";
import { safeNext } from "./safe-next";

export interface AccessRequest {
	url: URL;
	/** The HTTP method, for example `GET` or `POST`. */
	method: string;
	/** The `Origin` header of the request, or `null` when it has none. */
	origin: string | null;
	signedIn: boolean;
}

export type AccessDecision =
	| { action: "continue" }
	| { action: "redirect"; location: string }
	| { action: "unauthorized" }
	| { action: "forbidden" };

// The methods that change data. A browser sends `Origin` with each of them.
const WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

/**
 * True for a request that changes data and does not come from a page of the CMS. The
 * session cookie goes with a request from another site, so the guard refuses such a write.
 * A write with no `Origin` header is refused also.
 */
export function isCrossOriginWrite(request: AccessRequest): boolean {
	if (!A.includes(WRITE_METHODS, S.toUpperCase(request.method))) return false;
	return request.origin !== request.url.origin;
}

/**
 * The rule of the sign-in guard. A write from another origin is refused. An endpoint of the
 * content API needs no session: it checks the API token of the site. The sign-in page is
 * open to a person who is not signed in, and it sends a signed-in person on to `next`. Each
 * other page needs a session: with no session, a page redirects to the sign-in page and an
 * endpoint answers 401.
 */
export function decideAccess(request: AccessRequest): AccessDecision {
	if (isCrossOriginWrite(request)) return { action: "forbidden" };
	const { pathname, search, searchParams } = request.url;
	if (isContentApiPath(pathname)) return { action: "continue" };
	if (pathname === SIGN_IN_PATH) {
		if (!request.signedIn) return { action: "continue" };
		return { action: "redirect", location: safeNext(searchParams.get("next")) };
	}
	if (request.signedIn) return { action: "continue" };
	if (S.startsWith(pathname, "/api/")) return { action: "unauthorized" };
	return { action: "redirect", location: signInUrl(`${pathname}${search}`) };
}
