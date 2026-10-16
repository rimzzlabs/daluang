import { Button } from "@daluang/ui/components/button";
import { pipe, R } from "@mobily/ts-belt";
import { GithubLogoIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { authClient } from "../client";
import { SIGN_IN_PATH } from "../paths";

export interface SignInButtonProps {
	/** The path to open after the sign-in. Give it a value from `safeNext`. */
	next: string;
	className?: string;
}

type SignInState =
	| { status: "idle" }
	| { status: "pending" }
	| { status: "failed" };

/** Starts the sign-in with GitHub. GitHub then returns the person to the callback of Better Auth. */
export function SignInButton(props: SignInButtonProps) {
	const [state, setState] = useState<SignInState>({ status: "idle" });

	async function signIn() {
		setState({ status: "pending" });
		const result = await R.fromPromise(
			authClient.signIn.social({
				provider: "github",
				callbackURL: props.next,
				errorCallbackURL: SIGN_IN_PATH,
			}),
		);
		// On success the browser leaves for GitHub, so only a failure changes the state.
		const failed = pipe(
			result,
			R.map((response) => response.error !== null),
			R.getWithDefault(true),
		);
		if (failed) setState({ status: "failed" });
	}

	return (
		<div className={props.className}>
			<Button
				type="button"
				size="lg"
				className="w-full"
				disabled={state.status === "pending"}
				onClick={signIn}
			>
				<GithubLogoIcon weight="fill" />
				{state.status === "pending"
					? "Opening GitHub…"
					: "Continue with GitHub"}
			</Button>
			<p role="status" className="mt-3 min-h-5 text-sm text-destructive">
				{state.status === "failed"
					? "Daluang could not reach GitHub. Try again."
					: ""}
			</p>
		</div>
	);
}
