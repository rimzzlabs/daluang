import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		name: "api-tokens",
		environment: "node",
		// The same pool as the other workspaces. See `apps/cms/vitest.config.ts`.
		pool: "vmThreads",
		include: ["tests/**/*.test.{ts,tsx}"],
	},
});
