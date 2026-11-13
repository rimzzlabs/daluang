// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EditorToolbar } from "@/components/notes/editor-toolbar";

function renderToolbar() {
	const onAction = vi.fn();
	render(<EditorToolbar onAction={onAction} />);
	return onAction;
}

describe("EditorToolbar", () => {
	it("gives the action of a clicked button", async () => {
		const onAction = renderToolbar();
		await userEvent.click(
			screen.getByRole("button", { name: "Callout component" }),
		);
		expect(onAction).toHaveBeenCalledWith("callout");
	});

	it("has one tab stop, and moves between the buttons with the arrow keys", async () => {
		renderToolbar();
		await userEvent.tab();
		expect(document.activeElement?.getAttribute("aria-label")).toBe("Undo");
		await userEvent.keyboard("{ArrowRight}");
		expect(document.activeElement?.getAttribute("aria-label")).toBe("Redo");
		await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
		expect(document.activeElement?.getAttribute("aria-label")).toBe(
			"Callout component",
		);
		await userEvent.keyboard("{Home}");
		expect(document.activeElement?.getAttribute("aria-label")).toBe("Undo");
		await userEvent.keyboard("{End}{ArrowRight}");
		expect(document.activeElement?.getAttribute("aria-label")).toBe("Undo");
		await userEvent.keyboard("{Enter}");
		const tabStops = screen
			.getAllByRole("button")
			.filter((button) => button.tabIndex === 0);
		expect(tabStops).toHaveLength(1);
	});
});
