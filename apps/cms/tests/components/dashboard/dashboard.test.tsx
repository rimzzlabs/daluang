// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Dashboard } from "@/components/dashboard/dashboard";
import { createChangesStore } from "@/lib/notes/changes-store";
import { createSettingsStore } from "@/lib/settings/settings-store";
import { SETTINGS, settingsStore } from "../../settings";

const client = vi.hoisted(() => ({
	listPostsOfCms: vi.fn(),
	NOTES_ERROR_MESSAGES: { offline: "Offline." },
}));

vi.mock("@/lib/notes/client", () => client);

function post(id: string, status: "draft" | "published", language = "en") {
	return {
		note: {
			id,
			title: `Post ${id}`,
			slug: `post-${id}`,
			language,
			status,
			publishedAt: null,
			updatedAt: "2026-10-18T12:00:00.000Z",
			mark: null,
		},
		change: null,
	};
}

beforeEach(() => {
	client.listPostsOfCms.mockReset();
	client.listPostsOfCms.mockResolvedValue(R.Ok({ posts: [], count: 0 }));
});

function renderDashboard(settings = settingsStore()) {
	const changes = createChangesStore(0);
	render(<Dashboard settings={settings} changes={changes} linkKind="anchor" />);
	return changes;
}

describe("Dashboard", () => {
	it("shows the site with a link to it, a new post, and the steps to set it up", () => {
		renderDashboard();
		expect(
			screen.getByRole("heading", { level: 1, name: "rimzzlabs" }),
		).toBeTruthy();
		expect(
			screen.getByRole("link", { name: "rimzzlabs.com" }).getAttribute("href"),
		).toBe("https://rimzzlabs.com");
		expect(
			screen.getByRole("link", { name: "New post" }).getAttribute("href"),
		).toBe("/posts/new");
		expect(
			screen.getByRole("link", { name: "All posts" }).getAttribute("href"),
		).toBe("/posts");
		expect(
			screen.getByRole("heading", { name: "Set up your site" }),
		).toBeTruthy();
	});

	it("shows the recent posts and their numbers, and gives the navbar the changes", async () => {
		client.listPostsOfCms.mockResolvedValue(
			R.Ok({
				posts: [post("a", "draft"), post("b", "published", "id")],
				count: 2,
			}),
		);
		const changes = renderDashboard();
		const list = await screen.findByRole("list", { name: "Recent posts" });
		expect(within(list).getAllByRole("listitem")).toHaveLength(2);
		const byStatus = screen.getByLabelText("Posts by status");
		expect(byStatus.textContent).toBe("Drafts1Published1");
		expect(screen.getByLabelText("Posts by language").textContent).toBe(
			"English1Indonesia1",
		);
		expect(changes.read()).toBe(2);
	});

	it("asks for the address of a site with none", () => {
		const settings = createSettingsStore({
			...SETTINGS,
			site: { name: "Catatan", url: null },
		});
		renderDashboard(settings);
		expect(screen.getByText(/Your site has no address yet/)).toBeTruthy();
	});

	it("tells why the numbers are missing when the posts do not load", async () => {
		client.listPostsOfCms.mockResolvedValue(R.Error("offline"));
		renderDashboard();
		expect(
			await screen.findByText("The numbers show when the posts load."),
		).toBeTruthy();
	});
});
