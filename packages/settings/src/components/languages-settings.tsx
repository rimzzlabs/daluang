import { languagesSettingSchema } from "@daluang/notes/languages-setting";
import { R } from "@mobily/ts-belt";
import { type FormEvent, useState } from "react";
import { saveSettings } from "../client";
import { settingsState } from "../settings";
import type { SettingsStore } from "../settings-store";
import { useSettings } from "../settings-store";
import { LanguagesField } from "./languages-field";
import { type SaveState, SettingsForm } from "./settings-form";

export interface LanguagesSettingsProps {
	store: SettingsStore;
}

/** The settings page of the languages: the languages of the writer, and of a new note. */
export function LanguagesSettings(props: LanguagesSettingsProps) {
	const settings = useSettings(props.store);
	const [choice, setChoice] = useState(settings.languages);
	const [save, setSave] = useState<SaveState>({ status: "idle" });

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const parsed = languagesSettingSchema.safeParse(choice);
		if (!parsed.success) return;
		setSave({ status: "saving" });
		const saved = await saveSettings({ languages: parsed.data });
		R.match(
			saved,
			(stored) => {
				const state = settingsState(stored);
				if (state.status === "complete") props.store.write(state.settings);
				setSave({ status: "saved" });
			},
			(error) => setSave({ status: "failed", error }),
		);
	}

	return (
		<SettingsForm
			title="Languages"
			description="The languages that you write in. Each note has one language, and a note can have a translation in each other language."
			save={save}
			onSubmit={submit}
		>
			<LanguagesField
				value={choice}
				onChange={(next) => {
					setChoice(next);
					setSave({ status: "idle" });
				}}
			/>
		</SettingsForm>
	);
}
