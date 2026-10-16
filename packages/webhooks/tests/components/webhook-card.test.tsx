// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WebhookCard } from "../../src/components/webhook-card";

const client = vi.hoisted(() => ({
	removeWebhook: vi.fn(),
	testWebhookOfCms: vi.fn(),
	WEBHOOKS_ERROR_MESSAGES: {
		invalid: "Invalid.",
		"too-many": "Too many.",
		"not-found": "Not found.",
		"signed-out": "Signed out.",
		offline: "Offline.",
		server: "Server.",
	},
}));
vi.mock("../../src/client", () => client);

function delivery(index: number) {
	return {
		id: `d${index}`,
		event: "test" as const,
		status: "failed" as const,
		statusCode: null,
		durationMs: 10,
		createdAt: "2026-10-17T00:00:00.000Z",
	};
}

const WEBHOOK = {
	id: "w1",
	name: "Site",
	urlHint: "example.com/…c3d4",
	createdAt: "2026-10-17T00:00:00.000Z",
	deliveries: [1, 2, 3, 4, 5].map(delivery),
};

beforeEach(() => {
	client.removeWebhook.mockReset();
	client.testWebhookOfCms.mockReset();
});

function renderCard() {
	const onChange = vi.fn();
	const onRemoved = vi.fn();
	render(
		<ul>
			<WebhookCard
				webhook={WEBHOOK}
				onChange={onChange}
				onRemoved={onRemoved}
			/>
		</ul>,
	);
	return { onChange, onRemoved };
}

describe("WebhookCard", () => {
	it("puts the delivery of a test first, and keeps 5", async () => {
		client.testWebhookOfCms.mockResolvedValue(R.Ok(delivery(0)));
		const { onChange } = renderCard();
		await userEvent.click(
			screen.getByRole("button", { name: "Send a test to Site" }),
		);
		expect(onChange).toHaveBeenCalledWith({
			...WEBHOOK,
			deliveries: [0, 1, 2, 3, 4].map(delivery),
		});
	});

	it("shows why a test failed", async () => {
		client.testWebhookOfCms.mockResolvedValue(R.Error("not-found"));
		renderCard();
		await userEvent.click(
			screen.getByRole("button", { name: "Send a test to Site" }),
		);
		expect(screen.getByRole("alert").textContent).toBe("Not found.");
	});

	it("keeps the webhook on Keep, and shows why a remove failed", async () => {
		client.removeWebhook.mockResolvedValue(R.Error("offline"));
		const { onRemoved } = renderCard();
		await userEvent.click(screen.getByRole("button", { name: "Remove Site" }));
		await userEvent.click(screen.getByRole("button", { name: "Keep" }));
		await userEvent.click(screen.getByRole("button", { name: "Remove Site" }));
		await userEvent.click(
			screen.getByRole("button", { name: "Remove Site now" }),
		);
		expect(screen.getByRole("alert").textContent).toBe("Offline.");
		expect(onRemoved).not.toHaveBeenCalled();
	});
});
