// The settings that the middleware of the settings domain puts in `Astro.locals`.
// `apps/cms/src/env.d.ts` references this file. The value is `null` for the sign-in page
// and for an endpoint.
declare namespace App {
	interface Locals {
		settings: import("@daluang/settings/settings").SettingsState | null;
	}
}
