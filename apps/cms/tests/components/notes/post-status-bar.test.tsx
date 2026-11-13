// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	PostStatusBar,
	type SaveState,
} from "@/components/notes/post-status-bar";

function renderBar(body: string, save: SaveState = { status: "idle" }) {
	return render(<PostStatusBar body={body} save={save} />);
}

describe("PostStatusBar", () => {
	it("shows the words, the characters, and the read time of the body", () => {
		renderBar("# Resep Jotai");
		expect(
			screen.getByText("2 words · 13 characters · 1 min read"),
		).toBeTruthy();
	});

	it("uses one word for one, and a group mark for a large number", () => {
		renderBar(`hi ${"a".repeat(1200)}`);
		expect(
			screen.getByText("2 words · 1,203 characters · 1 min read"),
		).toBeTruthy();
		renderBar("hi");
		expect(screen.getByText("1 word · 2 characters · 1 min read")).toBeTruthy();
	});

	it("shows no save state before a save", () => {
		renderBar("");
		expect(screen.queryByRole("status")).toBeNull();
		expect(screen.queryByRole("alert")).toBeNull();
	});

	it("shows each state of the save", () => {
		const { rerender } = renderBar("", { status: "saving" });
		expect(screen.getByRole("status").textContent).toBe("Saving");
		rerender(<PostStatusBar body="" save={{ status: "saved" }} />);
		expect(screen.getByRole("status").textContent).toBe("Saved");
		rerender(
			<PostStatusBar
				body=""
				save={{ status: "failed", message: "Offline." }}
			/>,
		);
		expect(screen.getByRole("alert").textContent).toBe("Offline.");
	});
});
