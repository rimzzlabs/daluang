import { defineMiddleware } from "astro:middleware";
import { decideAccess } from "@daluang/auth/guard";
import { isAuthApiPath } from "@daluang/auth/paths";
import { match } from "ts-pattern";
import { getAuth } from "./auth";

/** The sign-in guard: it reads the session and applies the rule of `decideAccess`. */
export const onRequest = defineMiddleware(async (context, next) => {
	if (isAuthApiPath(context.url.pathname)) return next();

	const result = await getAuth().api.getSession({
		headers: context.request.headers,
	});
	context.locals.user = result?.user ?? null;
	context.locals.session = result?.session ?? null;

	const access = decideAccess({
		url: context.url,
		method: context.request.method,
		origin: context.request.headers.get("origin"),
		signedIn: result !== null,
	});
	return match(access)
		.with({ action: "continue" }, () => next())
		.with({ action: "redirect" }, (decision) =>
			context.redirect(decision.location),
		)
		.with({ action: "unauthorized" }, () =>
			Response.json({ error: "Sign in first." }, { status: 401 }),
		)
		.with({ action: "forbidden" }, () =>
			Response.json(
				{ error: "The request did not come from a page of this CMS." },
				{ status: 403 },
			),
		)
		.exhaustive();
});
