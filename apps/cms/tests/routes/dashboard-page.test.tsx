// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createChangesStore } from "@/lib/notes/changes-store";
import { DashboardPage } from "@/routes/dashboard-page";
import { settingsStore } from "../settings";

vi.mock("@/lib/notes/client", () => ({
	listPostsOfCms: () => Promise.resolve(R.Ok({ posts: [], count: 0 })),
	NOTES_ERROR_MESSAGES: {},
}));

describe("DashboardPage", () => {
	it("shows the dashboard", () => {
		render(
			<DashboardPage
				settings={settingsStore()}
				changes={createChangesStore(0)}
				linkKind="anchor"
				pathname="/"
			/>,
		);
		expect(
			screen.getByRole("heading", { name: "Set up your site" }),
		).toBeTruthy();
	});
});
