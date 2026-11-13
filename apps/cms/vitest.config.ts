import { fileURLToPath } from "node:url";
import { defineProject } from "vitest/config";

export default defineProject({
	resolve: {
		alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
	},
	test: {
		name: "cms",
		// Node.js by default. A test file that renders a component sets jsdom in its first
		// line: `// @vitest-environment jsdom`.
		environment: "node",
		// Each worker sets up its environment once, and each test file still gets a new VM
		// context, so a `vi.mock` stays in its file. A new worker for each file is slower.
		pool: "vmThreads",
		include: ["tests/**/*.test.{ts,tsx}"],
		setupFiles: ["tests/setup.ts"],
		// A test that loads CodeMirror in jsdom can take 5 s on a busy computer, and the
		// pre-push hook runs each test at once. The default of 5 s then fails a good test.
		testTimeout: 15_000,
	},
});
