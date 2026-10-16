import { describe, expect, it } from "vitest";
import {
	decideOnboarding,
	needsSettings,
	ONBOARDING_PATH,
} from "../src/onboarding";

describe("needsSettings", () => {
	it.each(["/", "/settings/languages", ONBOARDING_PATH])(
		"is true for the page %s",
		(path) => {
			expect(needsSettings(path)).toBe(true);
		},
	);

	it.each(["/sign-in", "/api/settings", "/api/auth/get-session"])(
		"is false for %s",
		(path) => {
			expect(needsSettings(path)).toBe(false);
		},
	);
});

describe("decideOnboarding", () => {
	it("sends a page to the onboarding when the settings are needed", () => {
		expect(decideOnboarding({ pathname: "/", status: "needed" })).toEqual({
			action: "redirect",
			location: ONBOARDING_PATH,
		});
	});

	it("opens the onboarding when the settings are needed", () => {
		expect(
			decideOnboarding({ pathname: ONBOARDING_PATH, status: "needed" }),
		).toEqual({ action: "continue" });
	});

	it("sends the onboarding to the notes when the settings are complete", () => {
		expect(
			decideOnboarding({ pathname: ONBOARDING_PATH, status: "complete" }),
		).toEqual({ action: "redirect", location: "/" });
	});

	it("opens a page when the settings are complete", () => {
		expect(
			decideOnboarding({ pathname: "/media", status: "complete" }),
		).toEqual({ action: "continue" });
	});
});
