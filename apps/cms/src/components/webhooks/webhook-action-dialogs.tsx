import { ConfirmDialog } from "@daluang/ui/components/confirm-dialog";
import {
	removeWebhook,
	testWebhookOfCms,
	WEBHOOKS_ERROR_MESSAGES,
} from "@daluang/webhooks/client";
import type { Delivery, Webhook } from "@daluang/webhooks/webhook";
import { R } from "@mobily/ts-belt";
import { useState } from "react";

type ActionState =
	| { status: "idle" }
	| { status: "running" }
	| { status: "failed"; message: string };

interface ActionDialogProps {
	/** The webhook of the action. The dialog keeps it while it closes. */
	webhook: Webhook | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export interface TestWebhookDialogProps extends ActionDialogProps {
	onDelivered: (id: string, delivery: Delivery) => void;
}

/**
 * The confirmation before a test. A deploy hook starts a build of the site, so the writer
 * sends a test on purpose. The delivery shows in the list after the dialog closes.
 */
export function TestWebhookDialog(props: TestWebhookDialogProps) {
	const [state, setState] = useState<ActionState>({ status: "idle" });
	const name = props.webhook?.name ?? "the webhook";

	async function sendTest() {
		const { webhook } = props;
		if (webhook === null) return;
		setState({ status: "running" });
		const result = await testWebhookOfCms(webhook.id);
		R.match(
			result,
			(delivery) => {
				setState({ status: "idle" });
				props.onDelivered(webhook.id, delivery);
				props.onOpenChange(false);
			},
			(error) =>
				setState({ status: "failed", message: WEBHOOKS_ERROR_MESSAGES[error] }),
		);
	}

	return (
		<ConfirmDialog
			open={props.open}
			onOpenChange={(open) => {
				props.onOpenChange(open);
				if (!open) setState({ status: "idle" });
			}}
			title={`Send a test to ${name}?`}
			description={`Daluang sends a POST to ${props.webhook?.urlHint ?? "the URL"}. A deploy hook starts a build of your site.`}
			confirmLabel="Send the test"
			pending={state.status === "running"}
			error={state.status === "failed" ? state.message : null}
			onConfirm={sendTest}
		/>
	);
}

export interface RemoveWebhookDialogProps extends ActionDialogProps {
	onRemoved: (id: string) => void;
}

/** The confirmation before a remove. The site no longer rebuilds from Daluang. */
export function RemoveWebhookDialog(props: RemoveWebhookDialogProps) {
	const [state, setState] = useState<ActionState>({ status: "idle" });
	const name = props.webhook?.name ?? "the webhook";

	async function remove() {
		const { webhook } = props;
		if (webhook === null) return;
		setState({ status: "running" });
		const result = await removeWebhook(webhook.id);
		R.match(
			result,
			() => {
				setState({ status: "idle" });
				props.onRemoved(webhook.id);
				props.onOpenChange(false);
			},
			(error) =>
				setState({ status: "failed", message: WEBHOOKS_ERROR_MESSAGES[error] }),
		);
	}

	return (
		<ConfirmDialog
			open={props.open}
			onOpenChange={(open) => {
				props.onOpenChange(open);
				if (!open) setState({ status: "idle" });
			}}
			title={`Remove ${name}?`}
			description="Daluang no longer sends a POST to its URL, and its deliveries leave the list. The deploy hook itself stays on your site."
			confirmLabel="Remove the webhook"
			destructive
			pending={state.status === "running"}
			error={state.status === "failed" ? state.message : null}
			onConfirm={remove}
		/>
	);
}
