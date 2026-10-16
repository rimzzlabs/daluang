import { Button } from "@daluang/ui/components/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@daluang/ui/components/field";
import { Input } from "@daluang/ui/components/input";
import { Spinner } from "@daluang/ui/components/spinner";
import { R } from "@mobily/ts-belt";
import { PlusIcon } from "@phosphor-icons/react";
import { type FormEvent, useId, useState } from "react";
import { TOKEN_NAME_MAX_LENGTH, tokenNameSchema } from "../api-token";
import {
	type ApiTokensError,
	type CreatedApiToken,
	createApiToken,
	TOKENS_ERROR_MESSAGES,
} from "../client";

export interface NewTokenFormProps {
	onCreated: (created: CreatedApiToken) => void;
}

type FormState =
	| { status: "idle" }
	| { status: "saving" }
	| { status: "invalid"; message: string }
	| { status: "failed"; error: ApiTokensError };

/** The form that makes a token. The writer names the token for the site that uses it. */
export function NewTokenForm(props: NewTokenFormProps) {
	const id = useId();
	const [name, setName] = useState("");
	const [state, setState] = useState<FormState>({ status: "idle" });

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const parsed = tokenNameSchema.safeParse(name);
		if (!parsed.success) {
			setState({
				status: "invalid",
				message: parsed.error.issues[0]?.message ?? "Give the token a name.",
			});
			return;
		}
		setState({ status: "saving" });
		const created = await createApiToken(parsed.data);
		R.match(
			created,
			(value) => {
				setName("");
				setState({ status: "idle" });
				props.onCreated(value);
			},
			(error) => setState({ status: "failed", error }),
		);
	}

	const invalid = state.status === "invalid";
	return (
		<form className="flex flex-col gap-3" noValidate onSubmit={submit}>
			<Field data-invalid={invalid}>
				<FieldLabel htmlFor={`${id}-name`}>Token name</FieldLabel>
				<div className="flex gap-2">
					<Input
						id={`${id}-name`}
						value={name}
						placeholder="rimzzlabs.com build"
						maxLength={TOKEN_NAME_MAX_LENGTH}
						autoComplete="off"
						aria-invalid={invalid}
						aria-describedby={`${id}-help`}
						onChange={(event) => {
							setName(event.target.value);
							setState({ status: "idle" });
						}}
					/>
					<Button type="submit" disabled={state.status === "saving"}>
						{state.status === "saving" ? (
							<Spinner data-icon="inline-start" />
						) : (
							<PlusIcon data-icon="inline-start" />
						)}
						Make a token
					</Button>
				</div>
				{invalid ? (
					<FieldError id={`${id}-help`}>{state.message}</FieldError>
				) : (
					<FieldDescription id={`${id}-help`}>
						Name the token for the site or the build that uses it.
					</FieldDescription>
				)}
			</Field>
			{state.status === "failed" ? (
				<p role="alert" className="text-sm text-destructive">
					{TOKENS_ERROR_MESSAGES[state.error]}
				</p>
			) : null}
		</form>
	);
}
