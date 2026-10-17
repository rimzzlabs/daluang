import { Badge } from "@daluang/ui/components/badge";
import { timeLabel } from "@daluang/webhooks/date-label";
import type { Delivery } from "@daluang/webhooks/webhook";
import { A } from "@mobily/ts-belt";

export interface DeliveryListProps {
	deliveries: readonly Delivery[];
}

const EVENT_LABELS: Record<Delivery["event"], string> = { test: "Test" };

function answerLabel(delivery: Delivery): string {
	if (delivery.statusCode === null) return "No answer";
	return `HTTP ${delivery.statusCode}`;
}

/** The newest deliveries of a webhook, with their result. */
export function DeliveryList(props: DeliveryListProps) {
	if (A.isEmpty(props.deliveries))
		return (
			<p className="text-sm text-muted-foreground">
				No deliveries yet. Send a test to check the URL.
			</p>
		);
	return (
		<ul className="flex flex-col gap-2" aria-label="Deliveries">
			{A.map(props.deliveries, (delivery) => (
				<li
					key={delivery.id}
					className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
				>
					<Badge
						variant={
							delivery.status === "delivered" ? "secondary" : "destructive"
						}
					>
						{delivery.status === "delivered" ? "Delivered" : "Failed"}
					</Badge>
					<span>{EVENT_LABELS[delivery.event]}</span>
					<span className="font-mono text-xs text-muted-foreground">
						{answerLabel(delivery)} · {delivery.durationMs} ms
					</span>
					<span className="text-muted-foreground">
						{timeLabel(delivery.createdAt)}
					</span>
				</li>
			))}
		</ul>
	);
}
