import { Button } from "@daluang/ui/components/button";
import { Spinner } from "@daluang/ui/components/spinner";
import { CheckIcon } from "@phosphor-icons/react";
import type { FormEvent, ReactNode } from "react";
import { match } from "ts-pattern";
import { SAVE_ERROR_MESSAGES, type SaveSettingsError } from "../client";

/** The state of a save of a settings page. */
export type SaveState =
	| { status: "idle" }
	| { status: "saving" }
	| { status: "saved" }
	| { status: "failed"; error: SaveSettingsError };

export interface SettingsFormProps {
	title: string;
	description: string;
	save: SaveState;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	children: ReactNode;
}

function saveMessage(save: SaveState): ReactNode {
	return match(save)
		.with({ status: "idle" }, { status: "saving" }, () => null)
		.with({ status: "saved" }, () => (
			<span className="inline-flex items-center gap-1.5 text-muted-foreground">
				<CheckIcon aria-hidden="true" />
				Saved
			</span>
		))
		.with({ status: "failed" }, (failed) => (
			<span className="text-destructive">
				{SAVE_ERROR_MESSAGES[failed.error]}
			</span>
		))
		.exhaustive();
}

/** The frame of a settings page: a title, the fields, and a save button with its result. */
export function SettingsForm(props: SettingsFormProps) {
	const saving = props.save.status === "saving";
	return (
		<section className="mx-auto flex w-full max-w-xl flex-col gap-8 px-6 py-10">
			<div className="flex flex-col gap-2">
				<h1 className="font-serif text-2xl font-semibold tracking-tight">
					{props.title}
				</h1>
				<p className="text-sm text-pretty text-muted-foreground">
					{props.description}
				</p>
			</div>
			<form
				className="flex flex-col gap-8"
				noValidate
				onSubmit={props.onSubmit}
			>
				{props.children}
				<div className="flex flex-wrap items-center gap-4">
					<Button type="submit" disabled={saving}>
						{saving ? <Spinner data-icon="inline-start" /> : null}
						Save
					</Button>
					<p role="status" className="text-sm">
						{saveMessage(props.save)}
					</p>
				</div>
			</form>
		</section>
	);
}
