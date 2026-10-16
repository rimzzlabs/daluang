// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OnboardingProgress } from "../../src/components/onboarding-progress";

describe("OnboardingProgress", () => {
	it("gives the number of the step, and marks the current step", () => {
		render(
			<OnboardingProgress steps={["Site", "Languages", "Ready"]} current={1} />,
		);
		expect(screen.getByText("Step 2 of 3")).toBeTruthy();
		const steps = screen.getAllByRole("listitem");
		expect(steps.map((step) => step.getAttribute("aria-current"))).toEqual([
			null,
			"step",
			null,
		]);
		expect(steps[1]?.textContent).toBe("Languages");
	});
});
