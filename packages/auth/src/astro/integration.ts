import type { AstroIntegration } from "astro";

/**
 * Adds the auth domain to the app: the endpoints of Better Auth at `/api/auth/*`, and the
 * sign-in guard as the first middleware. The app has no auth route file.
 */
export function daluangAuth(): AstroIntegration {
	return {
		name: "@daluang/auth",
		hooks: {
			"astro:config:setup": (params) => {
				params.injectRoute({
					pattern: "/api/auth/[...all]",
					entrypoint: "@daluang/auth/astro/route",
					prerender: false,
				});
				params.addMiddleware({
					entrypoint: "@daluang/auth/astro/middleware",
					order: "pre",
				});
			},
		},
	};
}
