// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WebhooksPage } from "@/routes/webhooks-page";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("WebhooksPage", () => {
	it("shows the webhooks of the server", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.resolve(Response.json({ webhooks: [] }))),
		);
		render(<WebhooksPage />);
		expect(screen.getByRole("heading", { name: "Webhooks" })).toBeTruthy();
		expect(await screen.findByText(/No webhooks yet/)).toBeTruthy();
	});
});
