import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Each workspace keeps its tests in `tests/`, next to `src/`.
		projects: ["apps/*/vitest.config.ts", "packages/*/vitest.config.ts"],
		coverage: {
			provider: "v8",
			// Each source file counts, also a file that no test imports. `pnpm test` fails
			// when a number is below its threshold. `docs/testing.md` has the rules.
			include: ["apps/*/src/**/*.{ts,tsx}", "packages/*/src/**/*.{ts,tsx}"],
			exclude: [
				"**/*.d.ts",
				// The UI primitives come from the shadcn registry. The package has no tests.
				"packages/ui/**",
				// The route types of the docs site. The Waku of Vocs writes the file at each
				// `vocs dev`, and Git ignores it.
				"apps/docs/src/pages.gen.ts",
				// The Astro layer of auth is wiring. The env module, the instance, the route, and
				// the middleware need the Workers runtime and `astro:middleware` to load. They
				// give the request to functions with tests: `createAuth`, `decideAccess`, and
				// the schema of `@daluang/auth/env`.
				"apps/cms/src/lib/auth/env.ts",
				"apps/cms/src/lib/auth/auth.ts",
				"apps/cms/src/pages/api/auth/\\[...all\\].ts",
				"apps/cms/src/lib/auth/middleware.ts",
				// Wiring also: one call of the setup hook of Astro, with no branch. A test of it
				// needs each parameter of that hook.
				"apps/cms/src/lib/auth/integration.ts",
				// Wiring also. It gives the Better Auth client two actions with no branch. The
				// tests of the components replace the module with a fake.
				"apps/cms/src/lib/auth/client.ts",
				// The Astro layer of the settings is wiring, as in the auth package. The env
				// module, the route, and the middleware need the Workers runtime and
				// `astro:middleware`. They give the request to `handleSettingsRequest`,
				// `readSettings`, and `decideOnboarding`, which have tests.
				"apps/cms/src/lib/settings/env.ts",
				"apps/cms/src/pages/api/settings.ts",
				"apps/cms/src/lib/settings/middleware.ts",
				"apps/cms/src/lib/settings/integration.ts",
				// The env module and the route files of the API tokens are wiring also. They need
				// the Workers runtime, and they give the request to `handleTokensRequest`, which
				// has tests. A glob reads `[id]` as a set of letters, so the brackets are escaped.
				"apps/cms/src/lib/api-tokens/env.ts",
				"apps/cms/src/pages/api/tokens.ts",
				"apps/cms/src/pages/api/tokens/\\[id\\].ts",
				// The env module and the route files of the webhooks are wiring also. They give
				// the request to `handleWebhooksRequest`, which has tests.
				"apps/cms/src/lib/webhooks/env.ts",
				"apps/cms/src/pages/api/webhooks.ts",
				"apps/cms/src/pages/api/webhooks/\\[...path\\].ts",
				// The env module and the route file of the notes are wiring also. They need the
				// Workers runtime, and they give the request to `handleNotesRequest`, which has
				// tests.
				"apps/cms/src/lib/notes/env.ts",
				"apps/cms/src/pages/api/notes.ts",
				// The security layer of the CMS app is wiring. The middleware needs
				// `astro:middleware` to load, and the integration is one call of the setup hook.
				// They give each response to `withSecurityHeaders`, which has tests.
				"apps/cms/src/lib/security/middleware.ts",
				"apps/cms/src/lib/security/integration.ts",
			],
			reporter: ["text-summary"],
			thresholds: {
				// The totals of the workspace.
				statements: 90,
				branches: 80,
				functions: 90,
				lines: 90,
				// Each file must also reach these numbers, so a file with no test cannot hide
				// in the totals.
				perFile: {
					statements: 80,
					branches: 70,
					functions: 80,
					lines: 80,
				},
			},
		},
	},
});
