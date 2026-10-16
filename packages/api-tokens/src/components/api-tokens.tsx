import { Button } from "@daluang/ui/components/button";
import { Skeleton } from "@daluang/ui/components/skeleton";
import { A, R } from "@mobily/ts-belt";
import { useEffect, useState } from "react";
import { match } from "ts-pattern";
import type { ApiToken } from "../api-token";
import {
	type ApiTokensError,
	type CreatedApiToken,
	listApiTokens,
	TOKENS_ERROR_MESSAGES,
} from "../client";
import { NewTokenForm } from "./new-token-form";
import { TokenList } from "./token-list";
import { TokenSecret } from "./token-secret";

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

/** The page of the API tokens: make a token, see the tokens, and revoke one. */
export function ApiTokens() {
	const [list, setList] = useState<ListState>({ status: "loading" });
	const [created, setCreated] = useState<CreatedApiToken | null>(null);

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

	function addToken(next: CreatedApiToken) {
		setCreated(next);
		setList(changeTokens((tokens) => [next.token, ...tokens]));
	}

	function removeToken(id: string) {
		// The token of the panel is no longer valid, so the panel closes.
		setCreated((current) => (current?.token.id === id ? null : current));
		setList(
			changeTokens((tokens) => A.reject(tokens, (token) => token.id === id)),
		);
	}

	return (
		<section className="mx-auto flex w-full max-w-xl flex-col gap-8 px-6 py-10">
			<div className="flex flex-col gap-2">
				<h1 className="font-serif text-2xl font-semibold tracking-tight">
					API tokens
				</h1>
				<p className="text-sm text-pretty text-muted-foreground">
					A token lets your site read the published notes through the API of
					Daluang. Give each site its own token, so you can revoke one without
					the others.
				</p>
			</div>
			<NewTokenForm onCreated={addToken} />
			{created === null ? null : (
				<TokenSecret
					name={created.token.name}
					secret={created.secret}
					onDone={() => setCreated(null)}
				/>
			)}
			{match(list)
				.with({ status: "loading" }, () => (
					<div role="status" className="flex flex-col gap-3">
						<span className="sr-only">Loading the tokens</span>
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
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
				.with({ status: "ready" }, (ready) => (
					<TokenList tokens={ready.tokens} onRevoked={removeToken} />
				))
				.exhaustive()}
		</section>
	);
}
