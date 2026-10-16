import { S } from "@mobily/ts-belt";
import { SIGN_IN_PATH, signInUrl } from "./paths";
import { safeNext } from "./safe-next";

export interface AccessRequest {
	url: URL;
	signedIn: boolean;
}

export type AccessDecision =
	| { action: "continue" }
	| { action: "redirect"; location: string }
	| { action: "unauthorized" };

/**
 * The rule of the sign-in guard. The sign-in page is open to a person who is not signed in,
 * and it sends a signed-in person on to `next`. Each other page needs a session: with no
 * session, a page redirects to the sign-in page and an endpoint answers 401.
 */
export function decideAccess(request: AccessRequest): AccessDecision {
	const { pathname, search, searchParams } = request.url;
	if (pathname === SIGN_IN_PATH) {
		if (!request.signedIn) return { action: "continue" };
		return { action: "redirect", location: safeNext(searchParams.get("next")) };
	}
	if (request.signedIn) return { action: "continue" };
	if (S.startsWith(pathname, "/api/")) return { action: "unauthorized" };
	return { action: "redirect", location: signInUrl(`${pathname}${search}`) };
}
