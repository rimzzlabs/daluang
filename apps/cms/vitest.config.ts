import { fileURLToPath } from "node:url";
import { defineProject } from "vitest/config";

export default defineProject({
	resolve: {
		alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
	},
	test: {
		name: "cms",
		environment: "jsdom",
		include: ["tests/**/*.test.{ts,tsx}"],
		setupFiles: ["tests/setup.ts"],
	},
});
