import { Button } from "@daluang/ui/components/button";
import { A } from "@mobily/ts-belt";
import type { ApiToken } from "../api-token";
import { dayLabel } from "../date-label";

export interface TokenListProps {
	tokens: readonly ApiToken[];
	/** The writer asks to revoke a token. The page asks for a confirmation. */
	onRevoke: (token: ApiToken) => void;
}

/** The tokens of the CMS: the name, the start, the dates, and a button to revoke. */
export function TokenList(props: TokenListProps) {
	return (
		<ul
			aria-label="API tokens"
			className="divide-y divide-border rounded-2xl border border-border"
		>
			{A.map(props.tokens, (token) => (
				<li
					key={token.id}
					className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center"
				>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium">{token.name}</p>
						<p className="text-sm text-muted-foreground">
							<code className="font-mono text-xs">{token.start}…</code> · Made{" "}
							{dayLabel(token.createdAt)} ·{" "}
							{token.lastUsedAt === null
								? "Never used"
								: `Used ${dayLabel(token.lastUsedAt)}`}
						</p>
					</div>
					<Button
						type="button"
						size="sm"
						variant="outline"
						className="self-start max-sm:h-11 sm:self-auto"
						aria-label={`Revoke ${token.name}`}
						onClick={() => props.onRevoke(token)}
					>
						Revoke
					</Button>
				</li>
			))}
		</ul>
	);
}
