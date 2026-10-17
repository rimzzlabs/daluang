import {
	createSettingsStore,
	type SettingsStore,
} from "@/lib/settings/settings-store";

/** The settings of a CMS after the onboarding, for the tests of the app. */
export const SETTINGS = {
	site: { name: "rimzzlabs", url: "https://rimzzlabs.com" },
	languages: { languages: ["en", "id"], defaultLanguage: "en" },
	fields: [],
};

/** A new store with `SETTINGS`, so a write in one test does not reach the next one. */
export function settingsStore(): SettingsStore {
	return createSettingsStore(SETTINGS);
}
