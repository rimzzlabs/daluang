import { defineMiddleware } from "astro:middleware";
import { match } from "ts-pattern";
import { decideAccess } from "../guard";
import { isAuthApiPath } from "../paths";
import { getAuth } from "./auth";

/** The sign-in guard: it reads the session and applies the rule of `decideAccess`. */
export const onRequest = defineMiddleware(async (context, next) => {
	if (isAuthApiPath(context.url.pathname)) return next();

	const result = await getAuth().api.getSession({
		headers: context.request.headers,
	});
	context.locals.user = result?.user ?? null;
	context.locals.session = result?.session ?? null;

	return match(decideAccess({ url: context.url, signedIn: result !== null }))
		.with({ action: "continue" }, () => next())
		.with({ action: "redirect" }, (decision) =>
			context.redirect(decision.location),
		)
		.with({ action: "unauthorized" }, () =>
			Response.json({ error: "Sign in first." }, { status: 401 }),
		)
		.exhaustive();
});
