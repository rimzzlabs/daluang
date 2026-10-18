import { A, S } from "@mobily/ts-belt";

export const SIGN_IN_PATH = "/sign-in";

const AUTH_API_PREFIX = "/api/auth/";

// The endpoints that a site reads at its build, with an API token and no session.
const CONTENT_API_PREFIX = "/api/content/";

/**
 * The endpoints of Better Auth that the CMS uses: the sign-in with GitHub, its callback,
 * the session, the sign-out, and the error page of a failed callback. Each other endpoint
 * of Better Auth answers 404. Better Auth has endpoints that give the GitHub access token
 * or link a second account, and the CMS needs none of them.
 */
export const OPEN_AUTH_PATHS = [
	"/api/auth/sign-in/social",
	"/api/auth/callback/github",
	"/api/auth/get-session",
	"/api/auth/sign-out",
	"/api/auth/error",
] as const;

/** True for a path that Better Auth answers itself. */
export function isAuthApiPath(pathname: string): boolean {
	return S.startsWith(pathname, AUTH_API_PREFIX);
}

/**
 * True for an endpoint that a site reads with an API token: `Authorization: Bearer dlg_…`.
 * The sign-in guard needs no session for it, because the endpoint checks the token.
 */
export function isContentApiPath(pathname: string): boolean {
	return S.startsWith(pathname, CONTENT_API_PREFIX);
}

/** True for an endpoint of Better Auth that the CMS opens. See `OPEN_AUTH_PATHS`. */
export function isOpenAuthPath(pathname: string): boolean {
	return A.includes(OPEN_AUTH_PATHS, pathname);
}

/** The sign-in URL that returns to `pathname` after the sign-in. */
export function signInUrl(pathname: string): string {
	if (pathname === "/") return SIGN_IN_PATH;
	return `${SIGN_IN_PATH}?next=${encodeURIComponent(pathname)}`;
}
