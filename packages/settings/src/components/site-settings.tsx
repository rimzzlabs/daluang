import { R } from "@mobily/ts-belt";
import { type FormEvent, useState } from "react";
import { saveSettings } from "../client";
import { settingsState } from "../settings";
import type { SettingsStore } from "../settings-store";
import { useSettings } from "../settings-store";
import type { SiteSetting } from "../site";
import { parseSiteDraft, type SiteErrors, siteDraft } from "../site-draft";
import { type SaveState, SettingsForm } from "./settings-form";
import { focusSiteError, SiteFields } from "./site-fields";

export interface SiteSettingsProps {
	store: SettingsStore;
}

/** The settings page of the site: its name and its address. */
export function SiteSettings(props: SiteSettingsProps) {
	const settings = useSettings(props.store);
	const [draft, setDraft] = useState(() => siteDraft(settings.site));
	const [errors, setErrors] = useState<SiteErrors>({});
	const [save, setSave] = useState<SaveState>({ status: "idle" });

	async function saveSite(site: SiteSetting) {
		setSave({ status: "saving" });
		const saved = await saveSettings({ site });
		R.match(
			saved,
			(stored) => {
				const state = settingsState(stored);
				if (state.status === "complete") props.store.write(state.settings);
				setDraft(siteDraft(stored.site));
				setSave({ status: "saved" });
			},
			(error) => setSave({ status: "failed", error }),
		);
	}

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		R.match(
			parseSiteDraft(draft),
			(site) => {
				setErrors({});
				saveSite(site);
			},
			(found) => {
				setErrors(found);
				focusSiteError({ form, errors: found });
			},
		);
	}

	return (
		<SettingsForm
			title="Site"
			description="The site that shows your notes."
			save={save}
			onSubmit={submit}
		>
			<SiteFields
				value={draft}
				errors={errors}
				onChange={(next) => {
					setDraft(next);
					setErrors({});
					setSave({ status: "idle" });
				}}
			/>
		</SettingsForm>
	);
}
