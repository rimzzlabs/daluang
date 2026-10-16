import { defineMiddleware } from "astro:middleware";
import { withSecurityHeaders } from "./headers";

/** Adds the security headers to each response, also to a redirect of the sign-in guard. */
export const onRequest = defineMiddleware(async (context, next) =>
	withSecurityHeaders(await next(), context.url),
);
