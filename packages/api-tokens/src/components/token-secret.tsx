import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@daluang/ui/components/alert";
import { Button } from "@daluang/ui/components/button";
import { R } from "@mobily/ts-belt";
import { CheckIcon, CopyIcon, KeyIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { match } from "ts-pattern";

export interface TokenSecretProps {
	name: string;
	secret: string;
	onDone: () => void;
}

type CopyState = "idle" | "copied" | "failed";

/** The new token, one time. After the writer leaves the page, only its start shows. */
export function TokenSecret(props: TokenSecretProps) {
	const [copy, setCopy] = useState<CopyState>("idle");

	async function copySecret() {
		const result = await R.fromPromise(
			navigator.clipboard.writeText(props.secret),
		);
		setCopy(R.isOk(result) ? "copied" : "failed");
	}

	return (
		<Alert>
			<KeyIcon />
			<AlertTitle>Copy the token of “{props.name}” now</AlertTitle>
			<AlertDescription className="flex flex-col gap-3">
				<p>
					Daluang shows the token one time only. Give it to your site as a
					secret, for example DALUANG_TOKEN.
				</p>
				<code className="block rounded-lg bg-muted px-3 py-2 font-mono text-xs break-all text-foreground select-all">
					{props.secret}
				</code>
				<div className="flex flex-wrap items-center gap-2">
					<Button type="button" size="sm" onClick={copySecret}>
						{copy === "copied" ? (
							<CheckIcon data-icon="inline-start" />
						) : (
							<CopyIcon data-icon="inline-start" />
						)}
						{copy === "copied" ? "Copied" : "Copy the token"}
					</Button>
					<Button
						type="button"
						size="sm"
						variant="ghost"
						onClick={props.onDone}
					>
						Done
					</Button>
					<span role="status" className="text-sm">
						{match(copy)
							.with("failed", () => "Select the token, then copy it.")
							.with("idle", "copied", () => "")
							.exhaustive()}
					</span>
				</div>
			</AlertDescription>
		</Alert>
	);
}
