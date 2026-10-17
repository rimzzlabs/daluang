import {
	SAVE_ERROR_MESSAGES,
	type SaveSettingsError,
} from "@daluang/settings/client";
import { Button } from "@daluang/ui/components/button";
import {
	Page,
	PageDescription,
	PageHeader,
	PageHeading,
	PageTitle,
} from "@daluang/ui/components/page";
import { Spinner } from "@daluang/ui/components/spinner";
import { CheckIcon } from "@phosphor-icons/react";
import type { FormEvent, ReactNode } from "react";
import { match } from "ts-pattern";

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

/** A settings page: its title, the fields of a form, and a save button with its result. */
export function SettingsForm(props: SettingsFormProps) {
	const saving = props.save.status === "saving";
	return (
		<Page>
			<PageHeader>
				<PageHeading>
					<PageTitle>{props.title}</PageTitle>
					<PageDescription>{props.description}</PageDescription>
				</PageHeading>
			</PageHeader>
			<form
				className="flex max-w-xl flex-col gap-6"
				noValidate
				onSubmit={props.onSubmit}
			>
				{props.children}
				<div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-3 border-t border-border pt-4">
					<p role="status" className="mr-auto text-sm">
						{saveMessage(props.save)}
					</p>
					<Button
						type="submit"
						disabled={saving}
						className="max-sm:h-11 max-sm:w-full"
					>
						{saving ? <Spinner data-icon="inline-start" /> : null}
						Save
					</Button>
				</div>
			</form>
		</Page>
	);
}
