// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createChangesStore } from "@/lib/notes/changes-store";
import { readNote } from "@/lib/notes/client";
import { EditPostPage, NewPostPage } from "@/routes/post-pages";
import { createAppRouter } from "@/routes/router";
import { settingsStore } from "../settings";

vi.mock("@/lib/notes/client", async (importOriginal) => ({
	...(await importOriginal<object>()),
	addNote: () => Promise.resolve(R.Ok({ id: "n9" })),
	listNotesOfCms: () => Promise.resolve(R.Ok([])),
	listPostsOfCms: () => Promise.resolve(R.Ok({ posts: [], count: 0 })),
	readNote: vi.fn((id: string) =>
		Promise.resolve(
			R.Ok({
				id,
				title: "Jotai recipes",
				slug: "jotai",
				language: "en",
				description: "",
				keywords: [],
				status: "draft",
				publishedAt: null,
				updatedAt: "2026-10-18T12:00:00.000Z",
				createdAt: "2026-10-18T12:00:00.000Z",
				fields: {},
				body: "# Jotai",
				published: null,
				mark: null,
			}),
		),
	),
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

	it("opens the post of the ID in the path", async () => {
		render(
			<EditPostPage
				settings={settingsStore()}
				changes={createChangesStore(0)}
				linkKind="anchor"
				pathname="/posts/n1"
			/>,
		);
		expect(await screen.findByDisplayValue("Jotai recipes")).toBeTruthy();
	});

	it("reads no post for a path with no ID", async () => {
		render(
			<EditPostPage
				settings={settingsStore()}
				changes={createChangesStore(0)}
				linkKind="anchor"
				pathname="/posts"
			/>,
		);
		await screen.findByDisplayValue("Jotai recipes");
		expect(readNote).toHaveBeenLastCalledWith("");
	});

	it("opens the page of a new translation", async () => {
		const router = createAppRouter({
			context: {
				user: { name: "Rizki Citra", githubLogin: "rimzzlabs", image: null },
				sidebar: { open: true, width: 16 },
				settings: settingsStore(),
				changes: createChangesStore(0),
			},
			history: createMemoryHistory({ initialEntries: ["/posts/n1"] }),
		});
		render(<RouterProvider router={router} />);
		await userEvent.click(
			await screen.findByRole("button", { name: "Translate" }),
		);
		await userEvent.click(
			await within(await screen.findByRole("dialog")).findByRole("button", {
				name: "Indonesia",
			}),
		);
		await waitFor(() =>
			expect(router.state.location.pathname).toBe("/posts/n9"),
		);
	});
});
