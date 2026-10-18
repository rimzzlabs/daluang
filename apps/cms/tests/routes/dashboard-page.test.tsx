// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createChangesStore } from "@/lib/notes/changes-store";
import { DashboardPage } from "@/routes/dashboard-page";
import { settingsStore } from "../settings";

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
