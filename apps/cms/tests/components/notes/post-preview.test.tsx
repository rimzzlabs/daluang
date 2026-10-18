// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PostPreview } from "@/components/notes/post-preview";

describe("PostPreview", () => {
	it("renders the Markdown of the body with Comark", async () => {
		render(<PostPreview body={"# Jotai\n\nSome **bold** text."} />);
		expect(
			await screen.findByRole("heading", { level: 1, name: "Jotai" }),
		).toBeTruthy();
		expect(screen.getByText("bold").tagName).toBe("STRONG");
	});

	it("shows a component of Comark with its tag", async () => {
		const { container } = render(
			<PostPreview body={'::callout{type="tip"}\nRun pnpm i first.\n::'} />,
		);
		await screen.findByText("Run pnpm i first.");
		expect(container.querySelector("callout")?.getAttribute("type")).toBe(
			"tip",
		);
	});

	it("asks for a body when the body is empty", () => {
		render(<PostPreview body="  " />);
		expect(
			screen.getByText("Write the body first. The preview shows it here."),
		).toBeTruthy();
	});
});
