import { defineMiddleware } from "astro:middleware";
import { decideOnboarding, needsSettings } from "@daluang/settings/onboarding";
import { settingsState } from "@daluang/settings/settings";
import { readSettings } from "@daluang/settings/store";
import { match } from "ts-pattern";
import { readSettingsEnv } from "./env";

/**
 * Reads the settings for each page, and puts them in `Astro.locals.settings`. With no
 * complete settings, a page opens the onboarding. The sign-in guard runs first, so the
 * person is signed in.
 */
export const onRequest = defineMiddleware(async (context, next) => {
	context.locals.settings = null;
	const { pathname } = context.url;
	if (!needsSettings(pathname)) return next();

	const state = settingsState(await readSettings(readSettingsEnv().DB));
	context.locals.settings = state;
	return match(decideOnboarding({ pathname, status: state.status }))
		.with({ action: "continue" }, () => next())
		.with({ action: "redirect" }, (decision) =>
			context.redirect(decision.location),
		)
		.exhaustive();
});
