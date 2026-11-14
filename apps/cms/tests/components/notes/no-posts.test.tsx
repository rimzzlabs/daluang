// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NoPosts } from "@/components/notes/no-posts";

describe("NoPosts", () => {
	it("links to a new post", () => {
		render(<NoPosts linkKind="anchor" onImport={vi.fn()} />);
		expect(screen.getByRole("heading", { name: "No posts yet" })).toBeTruthy();
		expect(
			screen.getByRole("link", { name: "New post" }).getAttribute("href"),
		).toBe("/posts/new");
	});

	it("opens the import of files", async () => {
		const onImport = vi.fn();
		render(<NoPosts linkKind="anchor" onImport={onImport} />);
		await userEvent.click(screen.getByRole("button", { name: "Import" }));
		expect(onImport).toHaveBeenCalledOnce();
	});
});
