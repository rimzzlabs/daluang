import type { AstroIntegration } from "astro";

/**
 * Adds the settings domain to the app: the endpoint `/api/settings`, and the middleware
 * that reads the settings for each page. Put it after `daluangAuth` in `integrations`, so
 * the sign-in guard runs first.
 */
export function daluangSettings(): AstroIntegration {
	return {
		name: "@daluang/settings",
		hooks: {
			"astro:config:setup": (params) => {
				params.injectRoute({
					pattern: "/api/settings",
					entrypoint: "@daluang/settings/astro/route",
					prerender: false,
				});
				params.addMiddleware({
					entrypoint: "@daluang/settings/astro/middleware",
					order: "pre",
				});
			},
		},
	};
}
