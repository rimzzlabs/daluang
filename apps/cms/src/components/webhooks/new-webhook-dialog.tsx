import { Button } from "@daluang/ui/components/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@daluang/ui/components/field";
import { Input } from "@daluang/ui/components/input";
import {
	ResponsiveDialog,
	ResponsiveDialogClose,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogFooter,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
} from "@daluang/ui/components/responsive-dialog";
import { Spinner } from "@daluang/ui/components/spinner";
import {
	newWebhookSchema,
	WEBHOOK_NAME_MAX_LENGTH,
	type Webhook,
} from "@daluang/webhooks/webhook";
import { A, O, pipe, R } from "@mobily/ts-belt";
import { type FormEvent, useId, useState } from "react";
import {
	addWebhook,
	WEBHOOKS_ERROR_MESSAGES,
	type WebhooksError,
} from "@/lib/webhooks/client";

export interface NewWebhookDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
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

interface WebhookFormProps {
	onAdded: (webhook: Webhook) => void;
	onPendingChange: (pending: boolean) => void;
}

function WebhookForm(props: WebhookFormProps) {
	const id = useId();
	const [name, setName] = useState("");
	const [url, setUrl] = useState("");
	const [state, setState] = useState<FormState>({ status: "idle" });
	const errors = state.status === "invalid" ? state.errors : {};
	const pending = state.status === "saving";

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
		props.onPendingChange(true);
		const added = await addWebhook(parsed.data);
		props.onPendingChange(false);
		R.match(
			added,
			(webhook) => {
				setState({ status: "idle" });
				props.onAdded(webhook);
			},
			(error) => setState({ status: "failed", error }),
		);
	}

	return (
		<form className="flex flex-col gap-6" noValidate onSubmit={submit}>
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
						onChange={(event) => setName(event.target.value)}
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
						onChange={(event) => setUrl(event.target.value)}
					/>
					{errors.url === undefined ? (
						<FieldDescription id={`${id}-url-help`}>
							The URL is a secret. The list shows only its host and its end.
						</FieldDescription>
					) : (
						<FieldError id={`${id}-url-help`}>{errors.url}</FieldError>
					)}
				</Field>
			</FieldGroup>
			{state.status === "failed" ? (
				<p role="alert" className="text-sm text-destructive">
					{WEBHOOKS_ERROR_MESSAGES[state.error]}
				</p>
			) : null}
			<ResponsiveDialogFooter>
				<ResponsiveDialogClose variant="outline" disabled={pending}>
					Cancel
				</ResponsiveDialogClose>
				<Button type="submit" disabled={pending}>
					{pending ? <Spinner data-icon="inline-start" /> : null}
					Add the webhook
				</Button>
			</ResponsiveDialogFooter>
		</form>
	);
}

/** The dialog that adds a webhook: a name and the URL of a deploy hook. */
export function NewWebhookDialog(props: NewWebhookDialogProps) {
	const [pending, setPending] = useState(false);
	return (
		<ResponsiveDialog
			open={props.open}
			onOpenChange={(open) => {
				if (!pending) props.onOpenChange(open);
			}}
		>
			<ResponsiveDialogContent showCloseButton={false}>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle>Add a webhook</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						For a site on Cloudflare Pages, make a deploy hook in the settings
						of the project, then paste its URL here.
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>
				<WebhookForm
					onPendingChange={setPending}
					onAdded={(webhook) => {
						props.onAdded(webhook);
						props.onOpenChange(false);
					}}
				/>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}
