import { S } from "@mobily/ts-belt";

export const SIGN_IN_PATH = "/sign-in";

const AUTH_API_PREFIX = "/api/auth/";

/** True for a path that Better Auth answers itself. */
export function isAuthApiPath(pathname: string): boolean {
	return S.startsWith(pathname, AUTH_API_PREFIX);
}

/** The sign-in URL that returns to `pathname` after the sign-in. */
export function signInUrl(pathname: string): string {
	if (pathname === "/") return SIGN_IN_PATH;
	return `${SIGN_IN_PATH}?next=${encodeURIComponent(pathname)}`;
}
