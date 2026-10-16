// @vitest-environment jsdom
import { createMemoryHistory } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { createAppRouter } from "@/routes/router";
import { settingsStore } from "../settings";

const context = {
	user: { name: "Rizki Citra", githubLogin: "rimzzlabs", image: null },
	sidebar: { open: true, width: 16 },
	settings: settingsStore(),
};

describe("createAppRouter", () => {
	it("starts at the path of a given history", () => {
		const history = createMemoryHistory({ initialEntries: ["/media"] });
		const router = createAppRouter({ context, history });
		expect(router.state.location.pathname).toBe("/media");
	});

	it("matches each route of the menus", () => {
		const router = createAppRouter({ context });
		const paths = Object.keys(router.routesByPath);
		expect(paths).toEqual(
			expect.arrayContaining([
				"/",
				"/media",
				"/settings/api-tokens",
				"/settings/webhooks",
				"/settings/site",
				"/settings/languages",
			]),
		);
	});
});
