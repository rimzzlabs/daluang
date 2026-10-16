import { describe, expect, it } from "vitest";
import {
	cmsSettingsSchema,
	settingsPatchSchema,
	settingsState,
} from "../src/settings";

const SITE = { name: "rimzzlabs", url: "https://rimzzlabs.com" };
const LANGUAGES = { languages: ["en", "id"], defaultLanguage: "en" };

describe("settingsState", () => {
	it("is complete when each setting has a value", () => {
		expect(settingsState({ site: SITE, languages: LANGUAGES })).toEqual({
			status: "complete",
			settings: { site: SITE, languages: LANGUAGES },
		});
	});

	it.each([
		["no site", { site: null, languages: LANGUAGES }],
		["no languages", { site: SITE, languages: null }],
		["no setting", { site: null, languages: null }],
	])("is needed with %s", (_name, stored) => {
		expect(settingsState(stored)).toEqual({ status: "needed", stored });
	});
});

describe("settingsPatchSchema", () => {
	it("accepts one setting", () => {
		expect(settingsPatchSchema.parse({ site: SITE })).toEqual({ site: SITE });
	});

	it("refuses a patch with no setting", () => {
		expect(settingsPatchSchema.safeParse({}).success).toBe(false);
	});

	it("refuses a key that is not a setting", () => {
		expect(
			settingsPatchSchema.safeParse({ site: SITE, theme: "dark" }).success,
		).toBe(false);
	});
});

describe("cmsSettingsSchema", () => {
	it("gives the canonical form of each value", () => {
		expect(
			cmsSettingsSchema.parse({
				site: { name: "  rimzzlabs ", url: "rimzzlabs.com/" },
				languages: { languages: ["EN", "id"], defaultLanguage: "en" },
			}),
		).toEqual({ site: SITE, languages: LANGUAGES });
	});
});
