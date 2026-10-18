// @vitest-environment jsdom
import { SidebarProvider } from "@daluang/ui/components/sidebar";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppNavbar } from "@/components/shell/app-navbar";
import { createChangesStore } from "@/lib/notes/changes-store";

describe("AppNavbar", () => {
	it("shows the title of the page, the sidebar trigger, the theme, and the account", () => {
		render(
			<SidebarProvider>
				<AppNavbar
					title="Posts"
					user={{ name: "Rizki Citra", githubLogin: "rimzzlabs", image: null }}
					changes={createChangesStore(0)}
				/>
			</SidebarProvider>,
		);
		expect(screen.getByText("Posts")).toBeTruthy();
		expect(
			screen.getByRole("button", { name: "Toggle the sidebar" }),
		).toBeTruthy();
		expect(
			screen.getByRole("button", { name: "Use the dark theme" }),
		).toBeTruthy();
		expect(
			screen.getByRole("button", { name: "Account menu of rimzzlabs" }),
		).toBeTruthy();
	});
});
