// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createChangesStore } from "@/lib/notes/changes-store";
import { NotesPage } from "@/routes/notes-page";
import { settingsStore } from "../settings";

vi.mock("@/lib/notes/client", () => ({
	listPostsOfCms: () => Promise.resolve(R.Ok({ posts: [], count: 0 })),
	NOTES_ERROR_MESSAGES: {},
}));

describe("NotesPage", () => {
	it("shows the posts", async () => {
		render(
			<NotesPage
				settings={settingsStore()}
				changes={createChangesStore(0)}
				linkKind="anchor"
			/>,
		);
		expect(
			await screen.findByRole("heading", { name: "No posts yet" }),
		).toBeTruthy();
	});
});
