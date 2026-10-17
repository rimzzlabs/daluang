import { Button } from "@daluang/ui/components/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@daluang/ui/components/empty";
import {
	Page,
	PageActions,
	PageDescription,
	PageHeader,
	PageHeading,
	PageTitle,
} from "@daluang/ui/components/page";
import { Skeleton } from "@daluang/ui/components/skeleton";
import { A, R } from "@mobily/ts-belt";
import { KeyIcon, PlusIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { match } from "ts-pattern";
import type { ApiToken } from "../api-token";
import {
	type ApiTokensError,
	listApiTokens,
	TOKENS_ERROR_MESSAGES,
} from "../client";
import { NewTokenDialog } from "./new-token-dialog";
import { RevokeTokenDialog } from "./revoke-token-dialog";
import { TokenList } from "./token-list";

type ListState =
	| { status: "loading" }
	| { status: "ready"; tokens: readonly ApiToken[] }
	| { status: "failed"; error: ApiTokensError };

function listState(
	result: R.Result<readonly ApiToken[], ApiTokensError>,
): ListState {
	return R.match(
		result,
		(tokens): ListState => ({ status: "ready", tokens }),
		(error): ListState => ({ status: "failed", error }),
	);
}

/**
 * A change of the list of the current state. A request can end after another change, so
 * the change reads the state then, not the state of the click.
 */
function changeTokens(
	change: (tokens: readonly ApiToken[]) => readonly ApiToken[],
): (current: ListState) => ListState {
	return (current) => {
		if (current.status !== "ready") return current;
		return { status: "ready", tokens: change(current.tokens) };
	};
}

interface RevokeTarget {
	open: boolean;
	/** The dialog keeps the token while it closes, so its title does not change. */
	token: ApiToken | null;
}

/** The page of the API tokens: make a token, see the tokens, and revoke one. */
export function ApiTokens() {
	const [list, setList] = useState<ListState>({ status: "loading" });
	const [making, setMaking] = useState(false);
	const [revoke, setRevoke] = useState<RevokeTarget>({
		open: false,
		token: null,
	});

	// The tokens are on the server, an external system. The page reads them when it opens.
	useEffect(() => {
		let current = true;
		listApiTokens().then((result) => {
			if (current) setList(listState(result));
		});
		return () => {
			current = false;
		};
	}, []);

	async function retry() {
		setList({ status: "loading" });
		setList(listState(await listApiTokens()));
	}

	const makeButton = (
		<Button type="button" onClick={() => setMaking(true)}>
			<PlusIcon data-icon="inline-start" />
			Make a token
		</Button>
	);

	return (
		<Page>
			<PageHeader>
				<PageHeading>
					<PageTitle>API tokens</PageTitle>
					<PageDescription>
						A token lets your site read the published notes through the API of
						Daluang. Give each site its own token, so you can revoke one without
						the others.
					</PageDescription>
				</PageHeading>
				<PageActions>{makeButton}</PageActions>
			</PageHeader>
			{match(list)
				.with({ status: "loading" }, () => (
					<div role="status" className="flex flex-col gap-2">
						<span className="sr-only">Loading the tokens</span>
						<Skeleton className="h-14 w-full" />
						<Skeleton className="h-14 w-full" />
					</div>
				))
				.with({ status: "failed" }, (failed) => (
					<div role="alert" className="flex flex-col items-start gap-3 text-sm">
						<p className="text-destructive">
							{TOKENS_ERROR_MESSAGES[failed.error]}
						</p>
						<Button type="button" variant="outline" size="sm" onClick={retry}>
							Try again
						</Button>
					</div>
				))
				.with({ status: "ready" }, (ready) =>
					A.isEmpty(ready.tokens) ? (
						<Empty className="border border-border">
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<KeyIcon />
								</EmptyMedia>
								<EmptyTitle>No tokens yet</EmptyTitle>
								<EmptyDescription>
									Make one token for each site that reads your notes.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					) : (
						<TokenList
							tokens={ready.tokens}
							onRevoke={(token) => setRevoke({ open: true, token })}
						/>
					),
				)
				.exhaustive()}
			<NewTokenDialog
				open={making}
				onOpenChange={setMaking}
				onCreated={(created) =>
					setList(changeTokens((tokens) => [created.token, ...tokens]))
				}
			/>
			<RevokeTokenDialog
				open={revoke.open}
				token={revoke.token}
				onOpenChange={(open) => setRevoke({ ...revoke, open })}
				onRevoked={(id) =>
					setList(
						changeTokens((tokens) =>
							A.reject(tokens, (token) => token.id === id),
						),
					)
				}
			/>
		</Page>
	);
}
