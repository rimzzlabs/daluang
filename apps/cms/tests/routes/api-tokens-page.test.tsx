// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiTokensPage } from "@/routes/api-tokens-page";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("ApiTokensPage", () => {
	it("shows the tokens of the server", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.resolve(Response.json({ tokens: [] }))),
		);
		render(<ApiTokensPage />);
		expect(screen.getByRole("heading", { name: "API tokens" })).toBeTruthy();
		expect(await screen.findByText(/No tokens yet/)).toBeTruthy();
	});
});
