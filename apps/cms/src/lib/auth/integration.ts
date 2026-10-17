import type { AstroIntegration } from "astro";

/**
 * Adds the sign-in guard as a middleware. Put it after `securityHeaders` and before
 * `settingsMiddleware` in `integrations`, so the guard runs before the settings are read.
 */
export function authGuard(): AstroIntegration {
	return {
		name: "@daluang/cms/auth",
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
