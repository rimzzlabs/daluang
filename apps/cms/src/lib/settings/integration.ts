import type { AstroIntegration } from "astro";

/**
 * Adds the middleware that reads the settings for each page. Put it after `daluangAuth` in
 * `integrations`, so the sign-in guard runs first.
 */
export function settingsMiddleware(): AstroIntegration {
	return {
		name: "@daluang/cms/settings",
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
