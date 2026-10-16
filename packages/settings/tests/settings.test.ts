import { describe, expect, it } from "vitest";
import {
	cmsSettingsSchema,
	settingsPatchSchema,
	settingsState,
} from "../src/settings";

const SITE = { name: "rimzzlabs", url: "https://rimzzlabs.com" };
const LANGUAGES = { languages: ["en", "id"], defaultLanguage: "en" };

const FEATURED = {
	name: "featured",
	label: "Featured",
	type: "boolean",
	required: false,
} as const;

describe("settingsState", () => {
	it("is complete when the site and the languages have a value", () => {
		expect(
			settingsState({ site: SITE, languages: LANGUAGES, fields: [FEATURED] }),
		).toEqual({
			status: "complete",
			settings: { site: SITE, languages: LANGUAGES, fields: [FEATURED] },
		});
	});

	it("gives no extra field when the fields have no value", () => {
		expect(
			settingsState({ site: SITE, languages: LANGUAGES, fields: null }),
		).toEqual({
			status: "complete",
			settings: { site: SITE, languages: LANGUAGES, fields: [] },
		});
	});

	it.each([
		["no site", { site: null, languages: LANGUAGES, fields: null }],
		["no languages", { site: SITE, languages: null, fields: null }],
		["no setting", { site: null, languages: null, fields: null }],
	])("is needed with %s", (_name, stored) => {
		expect(settingsState(stored)).toEqual({ status: "needed", stored });
	});
});

describe("settingsPatchSchema", () => {
	it("accepts one setting", () => {
		expect(settingsPatchSchema.parse({ site: SITE })).toEqual({ site: SITE });
		expect(settingsPatchSchema.parse({ fields: [FEATURED] })).toEqual({
			fields: [FEATURED],
		});
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
				fields: [{ ...FEATURED, label: " Featured " }],
			}),
		).toEqual({ site: SITE, languages: LANGUAGES, fields: [FEATURED] });
	});
});
