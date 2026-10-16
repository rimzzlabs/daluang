import { A } from "@mobily/ts-belt";
import { z } from "zod";
import { languageTagSchema } from "./language";

/** The languages that a writer uses in a CMS, and the language of a new note. */
export const languagesSettingSchema = z
	.object({
		languages: z.array(languageTagSchema).min(1, "Add at least one language."),
		defaultLanguage: languageTagSchema,
	})
	.superRefine((setting, context) => {
		if (A.length(A.uniq(setting.languages)) !== A.length(setting.languages)) {
			context.addIssue({
				code: "custom",
				message: "Each language can be on the list one time only.",
				path: ["languages"],
			});
		}
		if (!A.includes(setting.languages, setting.defaultLanguage)) {
			context.addIssue({
				code: "custom",
				message: "The default language must be on the list.",
				path: ["defaultLanguage"],
			});
		}
	});

export type LanguagesSetting = z.infer<typeof languagesSettingSchema>;

export interface LanguageCheck {
	language: string;
	setting: LanguagesSetting;
}

/** True when a note can use the language: the language is on the list of the CMS. */
export function isLanguageOfCms(check: LanguageCheck): boolean {
	return A.includes(check.setting.languages, check.language);
}
