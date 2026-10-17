import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		name: "auth",
		environment: "node",
		// Each worker sets up its environment once, and each test file still gets a new VM
		// context, so a `vi.mock` stays in its file. A new worker for each file is slower.
		pool: "vmThreads",
		include: ["tests/**/*.test.{ts,tsx}"],
	},
});
