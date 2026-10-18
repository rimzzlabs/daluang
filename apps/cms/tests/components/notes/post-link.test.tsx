// @vitest-environment jsdom
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PostLink } from "@/components/notes/post-link";

describe("PostLink", () => {
	it("links to the page of the post", () => {
		render(
			<PostLink kind="anchor" id="n 1">
				Jotai
			</PostLink>,
		);
		expect(
			screen.getByRole("link", { name: "Jotai" }).getAttribute("href"),
		).toBe("/posts/n%201");
	});

	it("is a link of the router in the app island", async () => {
		const rootRoute = createRootRoute({
			component: () => (
				<PostLink kind="router" id="n1">
					Jotai
				</PostLink>
			),
		});
		const postRoute = createRoute({
			getParentRoute: () => rootRoute,
			path: "/posts/$id",
		});
		const router = createRouter({
			routeTree: rootRoute.addChildren([postRoute]),
			history: createMemoryHistory({ initialEntries: ["/"] }),
		});
		render(<RouterProvider router={router} />);
		expect(
			(await screen.findByRole("link", { name: "Jotai" })).getAttribute("href"),
		).toBe("/posts/n1");
	});
});
