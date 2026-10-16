import type { AstroIntegration } from "astro";

/** Adds the API tokens domain to the app: the endpoints `/api/tokens` and `/api/tokens/<id>`. */
export function daluangApiTokens(): AstroIntegration {
	return {
		name: "@daluang/api-tokens",
		hooks: {
			"astro:config:setup": (params) => {
				params.injectRoute({
					pattern: "/api/tokens",
					entrypoint: "@daluang/api-tokens/astro/route",
					prerender: false,
				});
				params.injectRoute({
					pattern: "/api/tokens/[id]",
					entrypoint: "@daluang/api-tokens/astro/route",
					prerender: false,
				});
			},
		},
	};
}
