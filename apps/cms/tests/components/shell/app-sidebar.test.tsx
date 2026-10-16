import { SidebarProvider } from "@daluang/ui/components/sidebar";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	AppSidebar,
	isActivePath,
	NAV_GROUPS,
} from "@/components/shell/app-sidebar";

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

	it("marks the item of a page below its path", () => {
		renderAt("/settings/webhooks/deliveries");
		expect(
			screen
				.getByRole("link", { name: "Webhooks" })
				.hasAttribute("data-active"),
		).toBe(true);
		expect(
			screen.getByRole("link", { name: "Notes" }).hasAttribute("data-active"),
		).toBe(false);
	});

	it("shows each menu group with a link for each item", () => {
		renderAt("/");
		for (const group of NAV_GROUPS) {
			expect(screen.getByText(group.label)).toBeTruthy();
			for (const item of group.items) {
				expect(
					screen.getByRole("link", { name: item.label }).getAttribute("href"),
				).toBe(item.href);
			}
		}
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

describe("isActivePath", () => {
	it("matches the home page only at /", () => {
		expect(isActivePath("/", "/")).toBe(true);
		expect(isActivePath("/media", "/")).toBe(false);
	});

	it("matches a page and the pages below it, not a page that only starts the same", () => {
		expect(isActivePath("/media", "/media")).toBe(true);
		expect(isActivePath("/media/a.png", "/media")).toBe(true);
		expect(isActivePath("/mediakit", "/media")).toBe(false);
	});
});
