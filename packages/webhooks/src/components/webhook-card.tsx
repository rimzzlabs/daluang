import { Button } from "@daluang/ui/components/button";
import { PaperPlaneTiltIcon, TrashIcon } from "@phosphor-icons/react";
import type { Webhook } from "../webhook";
import { DeliveryList } from "./delivery-list";

export interface WebhookCardProps {
	webhook: Webhook;
	/** The writer asks to send a test. The page asks for a confirmation. */
	onTest: (webhook: Webhook) => void;
	/** The writer asks to remove the webhook. The page asks for a confirmation. */
	onRemove: (webhook: Webhook) => void;
}

/** One webhook: its name, its masked URL, its actions, and its newest deliveries. */
export function WebhookCard(props: WebhookCardProps) {
	const { webhook } = props;
	return (
		<li className="flex flex-col gap-4 px-4 py-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start">
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-medium">{webhook.name}</p>
					<p className="truncate font-mono text-xs text-muted-foreground">
						{webhook.urlHint}
					</p>
				</div>
				<div className="flex items-center gap-2 max-sm:*:h-11">
					<Button
						type="button"
						size="sm"
						variant="outline"
						aria-label={`Send a test to ${webhook.name}`}
						onClick={() => props.onTest(webhook)}
					>
						<PaperPlaneTiltIcon data-icon="inline-start" />
						Send a test
					</Button>
					<Button
						type="button"
						size="sm"
						variant="ghost"
						aria-label={`Remove ${webhook.name}`}
						onClick={() => props.onRemove(webhook)}
					>
						<TrashIcon data-icon="inline-start" />
						Remove
					</Button>
				</div>
			</div>
			<DeliveryList deliveries={webhook.deliveries} />
		</li>
	);
}
