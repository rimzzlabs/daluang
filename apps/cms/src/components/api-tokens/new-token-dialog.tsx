import {
	TOKEN_NAME_MAX_LENGTH,
	tokenNameSchema,
} from "@daluang/api-tokens/api-token";
import {
	type ApiTokensError,
	type CreatedApiToken,
	createApiToken,
	TOKENS_ERROR_MESSAGES,
} from "@daluang/api-tokens/client";
import { Button } from "@daluang/ui/components/button";
import {
	Field,
	FieldDescription,
	FieldError,
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
import { R } from "@mobily/ts-belt";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { type FormEvent, useId, useState } from "react";
import { match } from "ts-pattern";

export interface NewTokenDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreated: (created: CreatedApiToken) => void;
}

type DialogState =
	| { status: "form"; error: string | null }
	| { status: "saving" }
	| { status: "failed"; error: ApiTokensError }
	| { status: "created"; created: CreatedApiToken };

type CopyState = "idle" | "copied" | "failed";

interface TokenFormProps {
	pending: boolean;
	error: string | null;
	onSubmit: (name: string) => void;
}

function TokenForm(props: TokenFormProps) {
	const id = useId();
	const [name, setName] = useState("");
	return (
		<form
			className="flex flex-col gap-6"
			noValidate
			onSubmit={(event: FormEvent<HTMLFormElement>) => {
				event.preventDefault();
				props.onSubmit(name);
			}}
		>
			<Field data-invalid={props.error !== null}>
				<FieldLabel htmlFor={`${id}-name`}>Token name</FieldLabel>
				<Input
					id={`${id}-name`}
					value={name}
					placeholder="rimzzlabs.com build"
					maxLength={TOKEN_NAME_MAX_LENGTH}
					autoComplete="off"
					aria-invalid={props.error !== null}
					aria-describedby={`${id}-help`}
					onChange={(event) => setName(event.target.value)}
				/>
				{props.error === null ? (
					<FieldDescription id={`${id}-help`}>
						Name the token for the site or the build that uses it.
					</FieldDescription>
				) : (
					<FieldError id={`${id}-help`}>{props.error}</FieldError>
				)}
			</Field>
			<ResponsiveDialogFooter>
				<ResponsiveDialogClose variant="outline" disabled={props.pending}>
					Cancel
				</ResponsiveDialogClose>
				<Button type="submit" disabled={props.pending}>
					{props.pending ? <Spinner data-icon="inline-start" /> : null}
					Make the token
				</Button>
			</ResponsiveDialogFooter>
		</form>
	);
}

interface TokenSecretProps {
	created: CreatedApiToken;
}

function TokenSecret(props: TokenSecretProps) {
	const [copy, setCopy] = useState<CopyState>("idle");

	async function copySecret() {
		const result = await R.fromPromise(
			navigator.clipboard.writeText(props.created.secret),
		);
		setCopy(R.isOk(result) ? "copied" : "failed");
	}

	return (
		<>
			<div className="flex flex-col gap-3">
				<code className="block rounded-xl bg-muted px-3 py-2 font-mono text-xs break-all text-foreground select-all">
					{props.created.secret}
				</code>
				<p role="status" className="min-h-5 text-sm text-muted-foreground">
					{match(copy)
						.with("failed", () => "Select the token, then copy it.")
						.with("copied", () => "The token is on your clipboard.")
						.with("idle", () => "")
						.exhaustive()}
				</p>
			</div>
			<ResponsiveDialogFooter>
				<ResponsiveDialogClose variant="outline">Done</ResponsiveDialogClose>
				<Button type="button" onClick={copySecret}>
					{copy === "copied" ? (
						<CheckIcon data-icon="inline-start" />
					) : (
						<CopyIcon data-icon="inline-start" />
					)}
					{copy === "copied" ? "Copied" : "Copy the token"}
				</Button>
			</ResponsiveDialogFooter>
		</>
	);
}

/**
 * The dialog that makes a token: a name first, then the token, one time. The token shows
 * until the writer closes the dialog.
 */
export function NewTokenDialog(props: NewTokenDialogProps) {
	const [state, setState] = useState<DialogState>({
		status: "form",
		error: null,
	});
	const pending = state.status === "saving";

	async function create(name: string) {
		const parsed = tokenNameSchema.safeParse(name);
		if (!parsed.success) {
			setState({
				status: "form",
				error: parsed.error.issues[0]?.message ?? "Give the token a name.",
			});
			return;
		}
		setState({ status: "saving" });
		const created = await createApiToken(parsed.data);
		R.match(
			created,
			(value) => {
				setState({ status: "created", created: value });
				props.onCreated(value);
			},
			(error) => setState({ status: "failed", error }),
		);
	}

	return (
		<ResponsiveDialog
			open={props.open}
			onOpenChange={(open) => {
				if (pending) return;
				props.onOpenChange(open);
				// The next opening starts with an empty form.
				if (!open) setState({ status: "form", error: null });
			}}
		>
			<ResponsiveDialogContent showCloseButton={false}>
				{state.status === "created" ? (
					<>
						<ResponsiveDialogHeader>
							<ResponsiveDialogTitle>
								Copy the token of “{state.created.token.name}”
							</ResponsiveDialogTitle>
							<ResponsiveDialogDescription>
								Daluang shows the token one time only. Give it to your site as a
								secret, for example DALUANG_TOKEN.
							</ResponsiveDialogDescription>
						</ResponsiveDialogHeader>
						<TokenSecret created={state.created} />
					</>
				) : (
					<>
						<ResponsiveDialogHeader>
							<ResponsiveDialogTitle>Make an API token</ResponsiveDialogTitle>
							<ResponsiveDialogDescription>
								A token lets one site read the published posts.
							</ResponsiveDialogDescription>
						</ResponsiveDialogHeader>
						<TokenForm
							pending={pending}
							error={match(state)
								.with({ status: "form" }, (form) => form.error)
								.with(
									{ status: "failed" },
									(failed) => TOKENS_ERROR_MESSAGES[failed.error],
								)
								.with({ status: "saving" }, () => null)
								.exhaustive()}
							onSubmit={create}
						/>
					</>
				)}
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}
