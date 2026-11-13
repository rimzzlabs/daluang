// @vitest-environment jsdom
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider,
} from "@tanstack/react-router";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { SaveState } from "@/components/notes/post-status-bar";
import {
	mustConfirmLeave,
	UnsavedPostGuard,
} from "@/components/notes/unsaved-post-guard";

function renderGuard(save: SaveState) {
	const rootRoute = createRootRoute({ component: () => <Outlet /> });
	const postRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/posts/$id",
		component: () => (
			<UnsavedPostGuard
				save={save}
				hasUnsaved={() => true}
				isInvalid={() => false}
			/>
		),
	});
	const postsRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/posts",
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([postRoute, postsRoute]),
		history: createMemoryHistory({ initialEntries: ["/posts/a"] }),
	});
	render(<RouterProvider router={router} />);
	return router;
}

function leave(router: ReturnType<typeof renderGuard>, to: string) {
	// The navigation waits for the answer of the dialog, so the test does not wait for it.
	act(() => {
		router.history.push(to);
	});
}

describe("mustConfirmLeave", () => {
	it.each<[SaveState, boolean, boolean, boolean]>([
		[{ status: "invalid" }, true, false, true],
		[{ status: "failed", message: "Not saved." }, true, false, true],
		[{ status: "failed", message: "Not saved." }, false, false, false],
		[{ status: "pending" }, true, true, true],
		[{ status: "pending" }, true, false, false],
		[{ status: "pending" }, false, true, false],
		[{ status: "saving" }, true, false, false],
		[{ status: "saved" }, false, false, false],
		[{ status: "idle" }, false, false, false],
	])(
		"asks for %o with unsaved text %s and a form that is not valid %s: %s",
		(save, unsaved, invalid, expected) => {
			expect(
				mustConfirmLeave({
					save,
					hasUnsaved: () => unsaved,
					isInvalid: () => invalid,
				}),
			).toBe(expected);
		},
	);
});

describe("UnsavedPostGuard", () => {
	it.each<SaveState>([
		{ status: "invalid" },
		{ status: "failed", message: "Not saved." },
	])("keeps the page of a post with status %o at Cancel", async (save) => {
		const router = renderGuard(save);
		await waitFor(() => expect(router.state.status).toBe("idle"));
		leave(router, "/posts");
		expect(
			await screen.findByRole("heading", { name: "Leave the post?" }),
		).toBeTruthy();
		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
		await waitFor(() =>
			expect(
				screen.queryByRole("heading", { name: "Leave the post?" }),
			).toBeNull(),
		);
		expect(router.state.location.pathname).toBe("/posts/a");
	});

	it("leaves the page at the confirmation", async () => {
		const router = renderGuard({ status: "invalid" });
		await waitFor(() => expect(router.state.status).toBe("idle"));
		leave(router, "/posts");
		await userEvent.click(
			await screen.findByRole("button", { name: "Leave the page" }),
		);
		await waitFor(() => expect(router.state.location.pathname).toBe("/posts"));
	});

	it("asks also before it opens another post", async () => {
		const router = renderGuard({ status: "failed", message: "Not saved." });
		await waitFor(() => expect(router.state.status).toBe("idle"));
		leave(router, "/posts/b");
		await userEvent.click(
			await screen.findByRole("button", { name: "Leave the page" }),
		);
		await waitFor(() =>
			expect(router.state.location.pathname).toBe("/posts/b"),
		);
	});

	it.each<SaveState>([{ status: "saved" }, { status: "pending" }])(
		"leaves with no question for status %o",
		async (save) => {
			const router = renderGuard(save);
			await waitFor(() => expect(router.state.status).toBe("idle"));
			leave(router, "/posts");
			await waitFor(() =>
				expect(router.state.location.pathname).toBe("/posts"),
			);
			expect(
				screen.queryByRole("heading", { name: "Leave the post?" }),
			).toBeNull();
		},
	);
});
