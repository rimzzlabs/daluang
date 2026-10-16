import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Each workspace keeps its tests in `tests/`, next to `src/`.
		projects: ["apps/*/vitest.config.ts", "packages/*/vitest.config.ts"],
		coverage: {
			provider: "v8",
			// Each source file counts, also a file that no test imports. `pnpm test` fails
			// when a number is below its threshold. AGENTS.md, "Tests", has the rules.
			include: ["apps/*/src/**/*.{ts,tsx}", "packages/*/src/**/*.{ts,tsx}"],
			exclude: [
				"**/*.d.ts",
				// The UI primitives come from the shadcn registry. The package has no tests.
				"packages/ui/**",
				// The route types of the docs site. The Waku of Vocs writes the file at each
				// `vocs dev`, and Git ignores it.
				"apps/docs/src/pages.gen.ts",
				// The Astro layer of the auth package is wiring. The env module, the instance,
				// the route, and the middleware need the Workers runtime and `astro:middleware`
				// to load. They give the request to functions with tests: `createAuth`,
				// and `decideAccess`, and the schema of `env.ts`.
				"packages/auth/src/astro/env.ts",
				"packages/auth/src/astro/auth.ts",
				"packages/auth/src/astro/route.ts",
				"packages/auth/src/astro/middleware.ts",
				// Wiring also: two calls of the setup hook of Astro, with no branch. A test of it
				// needs each parameter of that hook.
				"packages/auth/src/astro/integration.ts",
				// Wiring also. It gives the Better Auth client two actions with no branch. The
				// tests of the components replace the module with a fake.
				"packages/auth/src/client.ts",
				// The Astro layer of the settings package is wiring, as in the auth package. The
				// env module, the route, and the middleware need the Workers runtime and
				// `astro:middleware`. They give the request to `handleSettingsRequest`,
				// `readSettings`, and `decideOnboarding`, which have tests.
				"packages/settings/src/astro/env.ts",
				"packages/settings/src/astro/route.ts",
				"packages/settings/src/astro/middleware.ts",
				"packages/settings/src/astro/integration.ts",
				// The security layer of the CMS app is wiring. The middleware needs
				// `astro:middleware` to load, and the integration is one call of the setup hook.
				// They give each response to `withSecurityHeaders`, which has tests.
				"apps/cms/src/security/middleware.ts",
				"apps/cms/src/security/integration.ts",
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
