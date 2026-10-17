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
import { PlusIcon, WebhooksLogoIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { match } from "ts-pattern";
import {
	listWebhooksOfCms,
	WEBHOOKS_ERROR_MESSAGES,
	type WebhooksError,
} from "../client";
import type { Delivery, Webhook } from "../webhook";
import { NewWebhookDialog } from "./new-webhook-dialog";
import {
	RemoveWebhookDialog,
	TestWebhookDialog,
} from "./webhook-action-dialogs";
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

interface DeliveryAdd {
	webhook: Webhook;
	/** The webhook of the delivery. Another webhook stays as it is. */
	id: string;
	delivery: Delivery;
}

/** The webhook with a new delivery first, and the newest deliveries of the list. */
function withDelivery(add: DeliveryAdd): Webhook {
	if (add.webhook.id !== add.id) return add.webhook;
	return {
		...add.webhook,
		deliveries: A.take([add.delivery, ...add.webhook.deliveries], 5),
	};
}

type ActionKind = "test" | "remove";

interface ActionTarget {
	kind: ActionKind;
	open: boolean;
	/** The dialog keeps the webhook while it closes, so its title does not change. */
	webhook: Webhook | null;
}

/** The page of the webhooks: add one, send a test, see the deliveries, and remove one. */
export function Webhooks() {
	const [list, setList] = useState<ListState>({ status: "loading" });
	const [adding, setAdding] = useState(false);
	const [action, setAction] = useState<ActionTarget>({
		kind: "test",
		open: false,
		webhook: null,
	});

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

	// A test can take 10 seconds, and the writer can remove a webhook during it. Each
	// change reads the state when it applies, not the state of the click.
	function update(
		change: (webhooks: readonly Webhook[]) => readonly Webhook[],
	) {
		setList((current) => {
			if (current.status !== "ready") return current;
			return { status: "ready", webhooks: change(current.webhooks) };
		});
	}

	function openAction(kind: ActionKind, webhook: Webhook) {
		setAction({ kind, open: true, webhook });
	}

	function changeOpen(kind: ActionKind) {
		return (open: boolean) => setAction({ ...action, kind, open });
	}

	const addButton = (
		<Button type="button" onClick={() => setAdding(true)}>
			<PlusIcon data-icon="inline-start" />
			Add a webhook
		</Button>
	);

	return (
		<Page>
			<PageHeader>
				<PageHeading>
					<PageTitle>Webhooks</PageTitle>
					<PageDescription>
						A webhook tells your site to rebuild. Daluang sends a POST to its
						URL, for example the deploy hook of your site. A later release sends
						one when you publish a note.
					</PageDescription>
				</PageHeading>
				<PageActions>{addButton}</PageActions>
			</PageHeader>
			{match(list)
				.with({ status: "loading" }, () => (
					<div role="status" className="flex flex-col gap-2">
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
						<Empty className="flex-none border border-border p-8">
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<WebhooksLogoIcon />
								</EmptyMedia>
								<EmptyTitle>No webhooks yet</EmptyTitle>
								<EmptyDescription>
									Add the deploy hook of your site, so it rebuilds with your
									notes.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					) : (
						<ul
							aria-label="Webhooks"
							className="divide-y divide-border rounded-2xl border border-border"
						>
							{A.map(ready.webhooks, (webhook) => (
								<WebhookCard
									key={webhook.id}
									webhook={webhook}
									onTest={(target) => openAction("test", target)}
									onRemove={(target) => openAction("remove", target)}
								/>
							))}
						</ul>
					),
				)
				.exhaustive()}
			<NewWebhookDialog
				open={adding}
				onOpenChange={setAdding}
				onAdded={(webhook) => update((webhooks) => [webhook, ...webhooks])}
			/>
			<TestWebhookDialog
				webhook={action.webhook}
				open={action.open && action.kind === "test"}
				onOpenChange={changeOpen("test")}
				onDelivered={(id, delivery) =>
					update((webhooks) =>
						A.map(webhooks, (webhook) =>
							withDelivery({ webhook, id, delivery }),
						),
					)
				}
			/>
			<RemoveWebhookDialog
				webhook={action.webhook}
				open={action.open && action.kind === "remove"}
				onOpenChange={changeOpen("remove")}
				onRemoved={(id) =>
					update((webhooks) =>
						A.reject(webhooks, (webhook) => webhook.id === id),
					)
				}
			/>
		</Page>
	);
}
