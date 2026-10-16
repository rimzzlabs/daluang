import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		name: "notes",
		environment: "node",
		include: ["tests/**/*.test.ts"],
	},
});
