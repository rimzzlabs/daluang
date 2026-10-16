import type { AstroIntegration } from "astro";

/** Adds the webhooks domain to the app: the endpoints below `/api/webhooks`. */
export function daluangWebhooks(): AstroIntegration {
	return {
		name: "@daluang/webhooks",
		hooks: {
			"astro:config:setup": (params) => {
				params.injectRoute({
					pattern: "/api/webhooks",
					entrypoint: "@daluang/webhooks/astro/route",
					prerender: false,
				});
				params.injectRoute({
					pattern: "/api/webhooks/[...path]",
					entrypoint: "@daluang/webhooks/astro/route",
					prerender: false,
				});
			},
		},
	};
}
