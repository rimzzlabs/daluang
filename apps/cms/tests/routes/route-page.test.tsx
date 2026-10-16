// @vitest-environment jsdom
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { routePage } from "@/routes/route-page";
import { createAppRouter } from "@/routes/router";
import { settingsStore } from "../settings";

describe("routePage", () => {
	it("gives the page the settings of the router context", async () => {
		const router = createAppRouter({
			context: {
				user: { name: "Rizki Citra", githubLogin: "rimzzlabs", image: null },
				sidebar: { open: true, width: 16 },
				settings: settingsStore(),
			},
			history: createMemoryHistory({ initialEntries: ["/settings/site"] }),
		});
		render(<RouterProvider router={router} />);
		expect(await screen.findByLabelText("Site name")).toHaveProperty(
			"value",
			"rimzzlabs",
		);
	});

	it("gives a component with a name for the devtools of React", () => {
		expect(routePage("/media").name).toBe("RoutePage");
	});
});
