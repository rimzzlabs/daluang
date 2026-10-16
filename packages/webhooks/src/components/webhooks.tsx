import { Button } from "@daluang/ui/components/button";
import { Skeleton } from "@daluang/ui/components/skeleton";
import { A, R } from "@mobily/ts-belt";
import { useEffect, useState } from "react";
import { match } from "ts-pattern";
import {
	listWebhooksOfCms,
	WEBHOOKS_ERROR_MESSAGES,
	type WebhooksError,
} from "../client";
import type { Webhook } from "../webhook";
import { NewWebhookForm } from "./new-webhook-form";
import { WebhookCard } from "./webhook-card";

type ListState =
	| { status: "loading" }
	| { status: "ready"; webhooks: readonly Webhook[] }
	| { status: "failed"; error: WebhooksError };

function listState(
	result: R.Result<readonly Webhook[], WebhooksError>,
): ListState {
	return R.match(
		result,
		(webhooks): ListState => ({ status: "ready", webhooks }),
		(error): ListState => ({ status: "failed", error }),
	);
}

/** The page of the webhooks: add one, send a test, see the deliveries, and remove one. */
export function Webhooks() {
	const [list, setList] = useState<ListState>({ status: "loading" });

	// The webhooks are on the server, an external system. The page reads them when it opens.
	useEffect(() => {
		let current = true;
		listWebhooksOfCms().then((result) => {
			if (current) setList(listState(result));
		});
		return () => {
			current = false;
		};
	}, []);

	async function retry() {
		setList({ status: "loading" });
		setList(listState(await listWebhooksOfCms()));
	}

	function update(
		change: (webhooks: readonly Webhook[]) => readonly Webhook[],
	) {
		if (list.status === "ready")
			setList({ status: "ready", webhooks: change(list.webhooks) });
	}

	return (
		<section className="mx-auto flex w-full max-w-xl flex-col gap-8 px-6 py-10">
			<div className="flex flex-col gap-2">
				<h1 className="font-serif text-2xl font-semibold tracking-tight">
					Webhooks
				</h1>
				<p className="text-sm text-pretty text-muted-foreground">
					A webhook tells your site to rebuild. Daluang sends a POST to its URL,
					for example the deploy hook of your site. A later release sends one
					when you publish a note. Send a test now to check the URL.
				</p>
			</div>
			<NewWebhookForm
				onAdded={(webhook) => update((webhooks) => [webhook, ...webhooks])}
			/>
			{match(list)
				.with({ status: "loading" }, () => (
					<div role="status" className="flex flex-col gap-3">
						<span className="sr-only">Loading the webhooks</span>
						<Skeleton className="h-24 w-full" />
					</div>
				))
				.with({ status: "failed" }, (failed) => (
					<div role="alert" className="flex flex-col items-start gap-3 text-sm">
						<p className="text-destructive">
							{WEBHOOKS_ERROR_MESSAGES[failed.error]}
						</p>
						<Button type="button" variant="outline" size="sm" onClick={retry}>
							Try again
						</Button>
					</div>
				))
				.with({ status: "ready" }, (ready) =>
					A.isEmpty(ready.webhooks) ? (
						<p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
							No webhooks yet. Add the deploy hook of your site.
						</p>
					) : (
						<ul className="flex flex-col gap-3" aria-label="Webhooks">
							{A.map(ready.webhooks, (webhook) => (
								<WebhookCard
									key={webhook.id}
									webhook={webhook}
									onChange={(next) =>
										update((webhooks) =>
											A.map(webhooks, (item) =>
												item.id === next.id ? next : item,
											),
										)
									}
									onRemoved={(id) =>
										update((webhooks) =>
											A.reject(webhooks, (item) => item.id === id),
										)
									}
								/>
							))}
						</ul>
					),
				)
				.exhaustive()}
		</section>
	);
}
