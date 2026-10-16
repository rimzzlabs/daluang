import { defineMiddleware } from "astro:middleware";
import { S } from "@mobily/ts-belt";
import { isAuthApiPath, SIGN_IN_PATH, signInUrl } from "../paths";
import { safeNext } from "../safe-next";
import { getAuth } from "./auth";

/**
 * The sign-in guard. Each page and each endpoint needs a session, with two exceptions: the
 * sign-in page, and the endpoints of Better Auth. A page without a session redirects to the
 * sign-in page. An endpoint without a session answers 401.
 */
export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname, search } = context.url;
	if (isAuthApiPath(pathname)) return next();

	const result = await getAuth().api.getSession({
		headers: context.request.headers,
	});
	context.locals.user = result?.user ?? null;
	context.locals.session = result?.session ?? null;

	if (pathname === SIGN_IN_PATH) {
		if (result === null) return next();
		return context.redirect(safeNext(context.url.searchParams.get("next")));
	}
	if (result !== null) return next();

	if (S.startsWith(pathname, "/api/")) {
		return Response.json({ error: "Sign in first." }, { status: 401 });
	}
	return context.redirect(signInUrl(`${pathname}${search}`));
});
