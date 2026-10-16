import { S } from "@mobily/ts-belt";
import type { SettingsState } from "./settings";

/** The page that asks the writer for the settings at the first sign-in. */
export const ONBOARDING_PATH = "/welcome";

// The sign-in page shows no settings, and an endpoint reads the settings itself.
const PATHS_WITHOUT_SETTINGS = ["/sign-in"];

/** True for a page that reads the settings: each page, but not the sign-in page or an endpoint. */
export function needsSettings(pathname: string): boolean {
	if (S.startsWith(pathname, "/api/")) return false;
	return !PATHS_WITHOUT_SETTINGS.includes(pathname);
}

export interface OnboardingRequest {
	pathname: string;
	status: SettingsState["status"];
}

export type OnboardingDecision =
	| { action: "continue" }
	| { action: "redirect"; location: string };

/**
 * The rule of the onboarding. With no complete settings, each page opens the onboarding.
 * With complete settings, the onboarding opens the notes.
 */
export function decideOnboarding(
	request: OnboardingRequest,
): OnboardingDecision {
	const onOnboarding = request.pathname === ONBOARDING_PATH;
	if (request.status === "needed" && !onOnboarding)
		return { action: "redirect", location: ONBOARDING_PATH };
	if (request.status === "complete" && onOnboarding)
		return { action: "redirect", location: "/" };
	return { action: "continue" };
}
