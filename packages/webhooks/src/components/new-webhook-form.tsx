import { Button } from "@daluang/ui/components/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@daluang/ui/components/field";
import { Input } from "@daluang/ui/components/input";
import { Spinner } from "@daluang/ui/components/spinner";
import { A, O, pipe, R } from "@mobily/ts-belt";
import { PlusIcon } from "@phosphor-icons/react";
import { type FormEvent, useId, useState } from "react";
import {
	addWebhook,
	WEBHOOKS_ERROR_MESSAGES,
	type WebhooksError,
} from "../client";
import {
	newWebhookSchema,
	WEBHOOK_NAME_MAX_LENGTH,
	type Webhook,
} from "../webhook";

export interface NewWebhookFormProps {
	onAdded: (webhook: Webhook) => void;
}

interface FormErrors {
	name?: string;
	url?: string;
}

type FormState =
	| { status: "idle" }
	| { status: "saving" }
	| { status: "invalid"; errors: FormErrors }
	| { status: "failed"; error: WebhooksError };

/** The form that adds a webhook: a name and the URL of a deploy hook. */
export function NewWebhookForm(props: NewWebhookFormProps) {
	const id = useId();
	const [name, setName] = useState("");
	const [url, setUrl] = useState("");
	const [state, setState] = useState<FormState>({ status: "idle" });
	const errors = state.status === "invalid" ? state.errors : {};

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const parsed = newWebhookSchema.safeParse({ name, url });
		if (!parsed.success) {
			const message = (field: keyof FormErrors) =>
				pipe(
					parsed.error.issues,
					A.find((issue) => issue.path[0] === field),
					O.map((issue) => issue.message),
					O.toUndefined,
				);
			setState({
				status: "invalid",
				errors: { name: message("name"), url: message("url") },
			});
			return;
		}
		setState({ status: "saving" });
		const added = await addWebhook(parsed.data);
		R.match(
			added,
			(webhook) => {
				setName("");
				setUrl("");
				setState({ status: "idle" });
				props.onAdded(webhook);
			},
			(error) => setState({ status: "failed", error }),
		);
	}

	return (
		<form className="flex flex-col gap-4" noValidate onSubmit={submit}>
			<FieldGroup className="gap-5">
				<Field data-invalid={errors.name !== undefined}>
					<FieldLabel htmlFor={`${id}-name`}>Webhook name</FieldLabel>
					<Input
						id={`${id}-name`}
						value={name}
						placeholder="rimzzlabs.com rebuild"
						maxLength={WEBHOOK_NAME_MAX_LENGTH}
						autoComplete="off"
						aria-invalid={errors.name !== undefined}
						onChange={(event) => {
							setName(event.target.value);
							setState({ status: "idle" });
						}}
					/>
					{errors.name === undefined ? null : (
						<FieldError>{errors.name}</FieldError>
					)}
				</Field>
				<Field data-invalid={errors.url !== undefined}>
					<FieldLabel htmlFor={`${id}-url`}>URL</FieldLabel>
					<Input
						id={`${id}-url`}
						type="url"
						inputMode="url"
						value={url}
						placeholder="https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/…"
						autoComplete="off"
						spellCheck={false}
						aria-invalid={errors.url !== undefined}
						aria-describedby={`${id}-url-help`}
						onChange={(event) => {
							setUrl(event.target.value);
							setState({ status: "idle" });
						}}
					/>
					{errors.url === undefined ? (
						<FieldDescription id={`${id}-url-help`}>
							For a site on Cloudflare Pages, make a deploy hook in the settings
							of the project, then paste its URL. The URL is a secret: the list
							shows only its host and its end.
						</FieldDescription>
					) : (
						<FieldError id={`${id}-url-help`}>{errors.url}</FieldError>
					)}
				</Field>
			</FieldGroup>
			<Button
				type="submit"
				className="self-start"
				disabled={state.status === "saving"}
			>
				{state.status === "saving" ? (
					<Spinner data-icon="inline-start" />
				) : (
					<PlusIcon data-icon="inline-start" />
				)}
				Add the webhook
			</Button>
			{state.status === "failed" ? (
				<p role="alert" className="text-sm text-destructive">
					{WEBHOOKS_ERROR_MESSAGES[state.error]}
				</p>
			) : null}
		</form>
	);
}
