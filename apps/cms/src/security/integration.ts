import type { AstroIntegration } from "astro";

/**
 * Adds the middleware of the security headers. Put it first in `integrations`: it is then
 * the first middleware, before the sign-in guard, and each response gets the headers.
 */
export function securityHeaders(): AstroIntegration {
	return {
		name: "@daluang/cms/security",
		hooks: {
			"astro:config:setup": (params) => {
				params.addMiddleware({
					entrypoint: new URL("./middleware.ts", import.meta.url),
					order: "pre",
				});
			},
		},
	};
}
