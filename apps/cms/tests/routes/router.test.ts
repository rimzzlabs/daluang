// @vitest-environment jsdom
import { createMemoryHistory } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { createChangesStore } from "@/lib/notes/changes-store";
import { createAppRouter } from "@/routes/router";
import { settingsStore } from "../settings";

const context = {
	user: { name: "Rizki Citra", githubLogin: "rimzzlabs", image: null },
	sidebar: { open: true, width: 16 },
	settings: settingsStore(),
	changes: createChangesStore(0),
};

describe("createAppRouter", () => {
	it("starts at the path of a given history", () => {
		const history = createMemoryHistory({ initialEntries: ["/media"] });
		const router = createAppRouter({ context, history });
		expect(router.state.location.pathname).toBe("/media");
	});

	it("matches the page of a post by its ID, and the page of a new post", () => {
		const router = createAppRouter({ context });
		expect(router.matchRoutes("/posts/n1").at(-1)?.routeId).toBe("/posts/$id");
		expect(router.matchRoutes("/posts/new").at(-1)?.routeId).toBe("/posts/new");
	});

	it("matches each route of the menus", () => {
		const router = createAppRouter({ context });
		const paths = Object.keys(router.routesByPath);
		expect(paths).toEqual(
			expect.arrayContaining([
				"/",
				"/posts/new",
				"/posts/$id",
				"/media",
				"/settings/api-tokens",
				"/settings/webhooks",
				"/settings/site",
				"/settings/languages",
				"/settings/fields",
			]),
		);
	});
});
