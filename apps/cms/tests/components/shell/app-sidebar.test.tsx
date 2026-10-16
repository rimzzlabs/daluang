import { SidebarProvider } from "@daluang/ui/components/sidebar";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppSidebar } from "@/components/shell/app-sidebar";

function renderAt(pathname: string) {
	render(
		<SidebarProvider>
			<AppSidebar pathname={pathname} />
		</SidebarProvider>,
	);
}

describe("AppSidebar", () => {
	it("marks the item of the current page", () => {
		renderAt("/");
		const notes = screen.getByRole("link", { name: "Notes" });
		expect(notes.getAttribute("href")).toBe("/");
		expect(notes.hasAttribute("data-active")).toBe(true);
	});

	it("marks no item on another page", () => {
		renderAt("/settings");
		expect(
			screen.getByRole("link", { name: "Notes" }).hasAttribute("data-active"),
		).toBe(false);
	});

	it("links the wordmark to the home page and has a rail to resize", () => {
		renderAt("/");
		expect(
			screen.getByRole("link", { name: "Daluang" }).getAttribute("href"),
		).toBe("/");
		expect(
			screen.getByRole("separator", { name: "Resize the sidebar" }),
		).toBeTruthy();
	});
});
