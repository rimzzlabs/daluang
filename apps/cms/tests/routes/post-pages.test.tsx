// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createChangesStore } from "@/lib/notes/changes-store";
import { EditPostPage, NewPostPage } from "@/routes/post-pages";
import { createAppRouter } from "@/routes/router";
import { settingsStore } from "../settings";

vi.mock("@/lib/notes/client", async (importOriginal) => ({
	...(await importOriginal<object>()),
	addNote: () => Promise.resolve(R.Ok({})),
	listPostsOfCms: () => Promise.resolve(R.Ok({ posts: [], count: 0 })),
}));

describe("post pages", () => {
	it("shows the form of a new post", () => {
		render(
			<NewPostPage
				settings={settingsStore()}
				changes={createChangesStore(0)}
				linkKind="anchor"
				pathname="/posts/new"
			/>,
		);
		expect(screen.getByRole("heading", { name: "New post" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Save draft" })).toBeTruthy();
	});

	it("opens the list of posts after a new post is saved", async () => {
		const router = createAppRouter({
			context: {
				user: { name: "Rizki Citra", githubLogin: "rimzzlabs", image: null },
				sidebar: { open: true, width: 16 },
				settings: settingsStore(),
				changes: createChangesStore(0),
			},
			history: createMemoryHistory({ initialEntries: ["/posts/new"] }),
		});
		render(<RouterProvider router={router} />);
		await userEvent.type(
			await screen.findByRole("textbox", { name: "Title" }),
			"Jotai",
		);
		await userEvent.click(screen.getByRole("button", { name: "Save draft" }));
		await waitFor(() => expect(router.state.location.pathname).toBe("/"));
	});

	it("says that the page of a post comes later", () => {
		render(<EditPostPage />);
		expect(screen.getByRole("heading", { name: "Edit post" })).toBeTruthy();
		expect(screen.getByText("This page comes in a later step.")).toBeTruthy();
	});
});
