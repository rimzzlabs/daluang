import { languagesSettingSchema } from "@daluang/notes/languages-setting";
import { z } from "zod";
import { siteSettingSchema } from "./site";

/** The path of the endpoint of the settings. */
export const SETTINGS_API_PATH = "/api/settings";

/** The names of the settings, as the keys of the `setting` table. */
export const SETTING_KEYS = ["site", "languages"] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

/** The schema of each setting. The store validates each value from D1 with it. */
export const SETTING_SCHEMAS = {
	site: siteSettingSchema,
	languages: languagesSettingSchema,
} as const;

/** The settings of a CMS that a writer can use: each setting has a value. */
export const cmsSettingsSchema = z.object(SETTING_SCHEMAS);

export type CmsSettings = z.infer<typeof cmsSettingsSchema>;

/** The settings in D1. A setting with no row, or with a value that is not valid, is `null`. */
export const storedSettingsSchema = z.object({
	site: siteSettingSchema.nullable(),
	languages: languagesSettingSchema.nullable(),
});

export type StoredSettings = z.infer<typeof storedSettingsSchema>;

/** A change to the settings: one setting or more, each one with its full value. */
export const settingsPatchSchema = z
	.strictObject({
		site: siteSettingSchema.optional(),
		languages: languagesSettingSchema.optional(),
	})
	.refine(
		(patch) => patch.site !== undefined || patch.languages !== undefined,
		"Give one setting or more.",
	);

export type SettingsPatch = z.input<typeof settingsPatchSchema>;

/**
 * The state of the settings of a CMS. The writer answers the onboarding questions before
 * the first note, so each page of the app can read `complete` settings.
 */
export type SettingsState =
	| { status: "complete"; settings: CmsSettings }
	| { status: "needed"; stored: StoredSettings };

export function settingsState(stored: StoredSettings): SettingsState {
	const { site, languages } = stored;
	if (site === null || languages === null) return { status: "needed", stored };
	return { status: "complete", settings: { site, languages } };
}
