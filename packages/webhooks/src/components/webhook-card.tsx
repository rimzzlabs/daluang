import { Button } from "@daluang/ui/components/button";
import { Spinner } from "@daluang/ui/components/spinner";
import { A, R } from "@mobily/ts-belt";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { useState } from "react";
import {
	removeWebhook,
	testWebhookOfCms,
	WEBHOOKS_ERROR_MESSAGES,
	type WebhooksError,
} from "../client";
import type { Webhook } from "../webhook";
import { DeliveryList } from "./delivery-list";

export interface WebhookCardProps {
	webhook: Webhook;
	onChange: (next: Webhook) => void;
	onRemoved: (id: string) => void;
}

type ActionState =
	| { status: "idle" }
	| { status: "testing" }
	| { status: "confirming" }
	| { status: "removing" }
	| { status: "failed"; error: WebhooksError };

/** One webhook: its name, its masked URL, a test, a remove, and its deliveries. */
export function WebhookCard(props: WebhookCardProps) {
	const { webhook } = props;
	const [action, setAction] = useState<ActionState>({ status: "idle" });
	const busy = action.status === "testing" || action.status === "removing";

	async function sendTest() {
		setAction({ status: "testing" });
		const result = await testWebhookOfCms(webhook.id);
		R.match(
			result,
			(delivery) => {
				setAction({ status: "idle" });
				props.onChange({
					...webhook,
					deliveries: A.take([delivery, ...webhook.deliveries], 5),
				});
			},
			(error) => setAction({ status: "failed", error }),
		);
	}

	async function removeNow() {
		setAction({ status: "removing" });
		const result = await removeWebhook(webhook.id);
		R.match(
			result,
			() => props.onRemoved(webhook.id),
			(error) => setAction({ status: "failed", error }),
		);
	}

	const confirming =
		action.status === "confirming" || action.status === "removing";
	return (
		<li className="flex flex-col gap-4 rounded-2xl border border-border p-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start">
				<div className="min-w-0 flex-1">
					<p className="truncate font-medium">{webhook.name}</p>
					<p className="truncate font-mono text-xs text-muted-foreground">
						{webhook.urlHint}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{confirming ? (
						<>
							<Button
								type="button"
								size="sm"
								variant="destructive"
								disabled={busy}
								aria-label={`Remove ${webhook.name} now`}
								onClick={removeNow}
							>
								{action.status === "removing" ? (
									<Spinner data-icon="inline-start" />
								) : null}
								Remove now
							</Button>
							<Button
								type="button"
								size="sm"
								variant="ghost"
								disabled={busy}
								onClick={() => setAction({ status: "idle" })}
							>
								Keep
							</Button>
						</>
					) : (
						<>
							<Button
								type="button"
								size="sm"
								variant="outline"
								disabled={busy}
								aria-label={`Send a test to ${webhook.name}`}
								onClick={sendTest}
							>
								{action.status === "testing" ? (
									<Spinner data-icon="inline-start" />
								) : (
									<PaperPlaneTiltIcon data-icon="inline-start" />
								)}
								Send a test
							</Button>
							<Button
								type="button"
								size="sm"
								variant="ghost"
								disabled={busy}
								aria-label={`Remove ${webhook.name}`}
								onClick={() => setAction({ status: "confirming" })}
							>
								Remove
							</Button>
						</>
					)}
				</div>
			</div>
			{action.status === "failed" ? (
				<p role="alert" className="text-sm text-destructive">
					{WEBHOOKS_ERROR_MESSAGES[action.error]}
				</p>
			) : null}
			<DeliveryList deliveries={webhook.deliveries} />
		</li>
	);
}
