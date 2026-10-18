// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PostMenu } from "@/components/notes/post-menu";

const NOTE = {
	id: "n1",
	title: "Jotai recipes",
	slug: "jotai-recipes",
	language: "en",
	status: "draft" as const,
	publishedAt: null,
	updatedAt: "2026-10-18T12:00:00.000Z",
	mark: null,
};

async function openMenu() {
	await userEvent.click(
		screen.getByRole("button", { name: "Actions of Jotai recipes" }),
	);
}

describe("PostMenu", () => {
	it("publishes a draft", async () => {
		const onAction = vi.fn();
		render(
			<PostMenu post={{ note: NOTE, change: null }} onAction={onAction} />,
		);
		await openMenu();
		const publish = await screen.findByRole("menuitem", { name: "Publish" });
		expect(
			screen.getAllByRole("menuitem").map((item) => item.textContent),
		).toEqual(["Publish", "Delete"]);
		await userEvent.click(publish);
		expect(onAction).toHaveBeenCalledWith("publish");
	});

	it("cancels a change that waits", async () => {
		const onAction = vi.fn();
		render(
			<PostMenu post={{ note: NOTE, change: "publish" }} onAction={onAction} />,
		);
		await openMenu();
		await userEvent.click(
			await screen.findByRole("menuitem", { name: "Cancel the change" }),
		);
		expect(onAction).toHaveBeenCalledWith("cancel");
	});

	it("deletes a post", async () => {
		const onAction = vi.fn();
		render(
			<PostMenu post={{ note: NOTE, change: null }} onAction={onAction} />,
		);
		await openMenu();
		await userEvent.click(
			await screen.findByRole("menuitem", { name: "Delete" }),
		);
		expect(onAction).toHaveBeenCalledWith("delete");
	});
});
