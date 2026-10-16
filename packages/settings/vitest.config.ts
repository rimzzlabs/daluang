import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		name: "settings",
		// Node.js by default. A test file that renders a component sets jsdom in its first
		// line: `// @vitest-environment jsdom`.
		environment: "node",
		// The same pool as the other workspaces. See `apps/cms/vitest.config.ts`.
		pool: "vmThreads",
		include: ["tests/**/*.test.{ts,tsx}"],
		setupFiles: ["tests/setup.ts"],
	},
});
