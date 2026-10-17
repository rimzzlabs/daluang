// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FieldList } from "@/components/settings/field-list";

const FIELDS = [
	{ name: "featured", label: "Featured", type: "boolean", required: true },
	{ name: "tags", label: "Tags", type: "list", required: false },
] as const;

describe("FieldList", () => {
	it("shows the name, the type, and Required of each field", () => {
		render(
			<FieldList fields={[...FIELDS]} onEdit={() => {}} onRemove={() => {}} />,
		);
		expect(screen.getByText("featured")).toBeTruthy();
		expect(screen.getByText("Yes or no")).toBeTruthy();
		expect(screen.getByText("List of text")).toBeTruthy();
		expect(screen.getAllByText("Required")).toHaveLength(1);
	});

	it("gives the index of a field to change or to remove", async () => {
		const onEdit = vi.fn();
		const onRemove = vi.fn();
		render(
			<FieldList fields={[...FIELDS]} onEdit={onEdit} onRemove={onRemove} />,
		);
		await userEvent.click(screen.getByRole("button", { name: "Change Tags" }));
		await userEvent.click(
			screen.getByRole("button", { name: "Remove Featured" }),
		);
		expect(onEdit).toHaveBeenCalledWith(1);
		expect(onRemove).toHaveBeenCalledWith(0);
	});
});
