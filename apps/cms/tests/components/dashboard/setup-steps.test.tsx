// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SetupSteps } from "@/components/dashboard/setup-steps";

describe("SetupSteps", () => {
	it("links to each setting that a site needs", () => {
		render(<SetupSteps linkKind="anchor" />);
		expect(
			screen.getAllByRole("link").map((link) => link.getAttribute("href")),
		).toEqual([
			"/settings/fields",
			"/settings/api-tokens",
			"/settings/webhooks",
		]);
	});
});
