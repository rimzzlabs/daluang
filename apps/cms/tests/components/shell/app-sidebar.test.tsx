// @vitest-environment jsdom
import { SidebarProvider } from "@daluang/ui/components/sidebar";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	AppSidebar,
	isActivePath,
	NAV_GROUPS,
} from "@/components/shell/app-sidebar";
import { SETTINGS, settingsStore } from "../../settings";

function renderAt(pathname: string, store = settingsStore()) {
	render(
		<SidebarProvider>
			<AppSidebar pathname={pathname} linkKind="anchor" settings={store} />
		</SidebarProvider>,
	);
	return store;
}

describe("AppSidebar", () => {
	it("marks the item of the current page", () => {
		renderAt("/");
		const notes = screen.getByRole("link", { name: "Posts" });
		expect(notes.getAttribute("href")).toBe("/");
		expect(notes.hasAttribute("data-active")).toBe(true);
	});

	it("marks no item on another page", () => {
		renderAt("/settings");
		expect(
			screen.getByRole("link", { name: "Posts" }).hasAttribute("data-active"),
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
			screen.getByRole("link", { name: "Posts" }).hasAttribute("data-active"),
		).toBe(false);
	});

	it("marks Posts on the pages of the editor", () => {
		renderAt("/posts/new");
		expect(
			screen.getByRole("link", { name: "Posts" }).hasAttribute("data-active"),
		).toBe(true);
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
			screen.getByRole("link", { name: /^Daluang/ }).getAttribute("href"),
		).toBe("/");
		expect(
			screen.getByRole("separator", { name: "Resize the sidebar" }),
		).toBeTruthy();
	});
});

describe("AppSidebar site name", () => {
	it("shows the name of the site under the wordmark", () => {
		renderAt("/");
		expect(
			screen.getByRole("link", { name: /Daluang\s*rimzzlabs/ }),
		).toBeTruthy();
	});

	it("shows a new name after a write to the store", () => {
		const store = renderAt("/");
		act(() => {
			store.write({ ...SETTINGS, site: { name: "Catatan", url: null } });
		});
		expect(
			screen.getByRole("link", { name: /Daluang\s*Catatan/ }),
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
