// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FieldRow } from "../../src/components/field-row";
import { newFieldDraft } from "../../src/field-drafts";

describe("FieldRow", () => {
	it("names an empty field for the buttons of the row", () => {
		render(
			<ul>
				<FieldRow
					draft={newFieldDraft()}
					errors={{}}
					focus={false}
					onChange={() => {}}
					onRemove={() => {}}
				/>
			</ul>,
		);
		expect(
			screen.getByRole("button", { name: "Remove the new field" }),
		).toBeTruthy();
		expect(
			screen.getByRole("group", { name: "Type of the new field" }),
		).toBeTruthy();
		expect(document.activeElement).toBe(document.body);
	});
});
