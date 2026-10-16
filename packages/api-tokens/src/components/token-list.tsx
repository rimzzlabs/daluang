import { Button } from "@daluang/ui/components/button";
import { Spinner } from "@daluang/ui/components/spinner";
import { A, R } from "@mobily/ts-belt";
import { useState } from "react";
import type { ApiToken } from "../api-token";
import {
	type ApiTokensError,
	revokeApiToken,
	TOKENS_ERROR_MESSAGES,
} from "../client";
import { dayLabel } from "../date-label";

export interface TokenListProps {
	tokens: readonly ApiToken[];
	onRevoked: (id: string) => void;
}

type RevokeState =
	| { status: "idle" }
	| { status: "confirming" }
	| { status: "revoking" }
	| { status: "failed"; error: ApiTokensError };

interface TokenRowProps {
	token: ApiToken;
	onRevoked: (id: string) => void;
}

function TokenRow(props: TokenRowProps) {
	const { token } = props;
	const [revoke, setRevoke] = useState<RevokeState>({ status: "idle" });

	async function revokeNow() {
		setRevoke({ status: "revoking" });
		const result = await revokeApiToken(token.id);
		R.match(
			result,
			() => props.onRevoked(token.id),
			(error) => setRevoke({ status: "failed", error }),
		);
	}

	const used =
		token.lastUsedAt === null
			? "Never used"
			: `Used ${dayLabel(token.lastUsedAt)}`;
	return (
		<li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
			<div className="min-w-0 flex-1">
				<p className="truncate font-medium">{token.name}</p>
				<p className="text-sm text-muted-foreground">
					<code className="font-mono text-xs">{token.start}…</code> · Made{" "}
					{dayLabel(token.createdAt)} · {used}
				</p>
				{revoke.status === "failed" ? (
					<p role="alert" className="mt-1 text-sm text-destructive">
						{TOKENS_ERROR_MESSAGES[revoke.error]}
					</p>
				) : null}
			</div>
			{revoke.status === "confirming" || revoke.status === "revoking" ? (
				<div className="flex items-center gap-2">
					<Button
						type="button"
						size="sm"
						variant="destructive"
						disabled={revoke.status === "revoking"}
						onClick={revokeNow}
						aria-label={`Revoke ${token.name} now`}
					>
						{revoke.status === "revoking" ? (
							<Spinner data-icon="inline-start" />
						) : null}
						Revoke now
					</Button>
					<Button
						type="button"
						size="sm"
						variant="ghost"
						disabled={revoke.status === "revoking"}
						onClick={() => setRevoke({ status: "idle" })}
					>
						Keep
					</Button>
				</div>
			) : (
				<Button
					type="button"
					size="sm"
					variant="outline"
					aria-label={`Revoke ${token.name}`}
					onClick={() => setRevoke({ status: "confirming" })}
				>
					Revoke
				</Button>
			)}
		</li>
	);
}

/** The tokens of the CMS. A revoke asks one time more, because a site loses its access. */
export function TokenList(props: TokenListProps) {
	if (A.isEmpty(props.tokens))
		return (
			<p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
				No tokens yet. Make one token for each site that reads your notes.
			</p>
		);
	return (
		<ul className="divide-y divide-border">
			{A.map(props.tokens, (token) => (
				<TokenRow key={token.id} token={token} onRevoked={props.onRevoked} />
			))}
		</ul>
	);
}
