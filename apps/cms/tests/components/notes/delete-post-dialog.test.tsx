// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeletePostDialog } from "@/components/notes/delete-post-dialog";

const client = vi.hoisted(() => ({
	deleteNoteOfCms: vi.fn(),
	NOTES_ERROR_MESSAGES: { offline: "Offline." },
}));

vi.mock("@/lib/notes/client", () => client);

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

beforeEach(() => {
	client.deleteNoteOfCms.mockReset();
});

describe("DeletePostDialog", () => {
	it("deletes a draft at once, then closes", async () => {
		client.deleteNoteOfCms.mockResolvedValue(R.Ok(true));
		const onDeleted = vi.fn();
		const onOpenChange = vi.fn();
		render(
			<DeletePostDialog
				open
				post={{ note: NOTE, change: null }}
				onOpenChange={onOpenChange}
				onDeleted={onDeleted}
			/>,
		);
		expect(
			screen.getByRole("heading", { name: "Delete Jotai recipes?" }),
		).toBeTruthy();
		expect(screen.getByText(/deletes the draft at once/)).toBeTruthy();
		await userEvent.click(
			screen.getByRole("button", { name: "Delete the post" }),
		);
		expect(client.deleteNoteOfCms).toHaveBeenCalledWith("n1");
		expect(onDeleted).toHaveBeenCalledOnce();
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("tells that a published post waits for Publish changes", () => {
		render(
			<DeletePostDialog
				open
				post={{ note: { ...NOTE, status: "published" }, change: null }}
				onOpenChange={vi.fn()}
				onDeleted={vi.fn()}
			/>,
		);
		expect(
			screen.getByText(/keeps the post until you select Publish changes/),
		).toBeTruthy();
	});

	it("shows the message of a failed delete, and stays open", async () => {
		client.deleteNoteOfCms.mockResolvedValue(R.Error("offline"));
		const onDeleted = vi.fn();
		render(
			<DeletePostDialog
				open
				post={{ note: NOTE, change: null }}
				onOpenChange={vi.fn()}
				onDeleted={onDeleted}
			/>,
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Delete the post" }),
		);
		expect(await screen.findByText("Offline.")).toBeTruthy();
		expect(onDeleted).not.toHaveBeenCalled();
	});

	it("closes on Cancel, and deletes nothing with no post", async () => {
		const onOpenChange = vi.fn();
		render(
			<DeletePostDialog
				open
				post={null}
				onOpenChange={onOpenChange}
				onDeleted={vi.fn()}
			/>,
		);
		expect(
			screen.getByRole("heading", { name: "Delete the post?" }),
		).toBeTruthy();
		await userEvent.click(
			screen.getByRole("button", { name: "Delete the post" }),
		);
		expect(client.deleteNoteOfCms).not.toHaveBeenCalled();
		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});
