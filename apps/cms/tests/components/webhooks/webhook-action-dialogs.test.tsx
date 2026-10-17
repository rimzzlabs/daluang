// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	RemoveWebhookDialog,
	TestWebhookDialog,
} from "@/components/webhooks/webhook-action-dialogs";
import { DELIVERY, MESSAGES, WEBHOOK } from "./fixtures";

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
vi.mock("@/lib/webhooks/client", () => client);

beforeEach(() => {
	client.removeWebhook.mockReset();
	client.testWebhookOfCms.mockReset();
});

describe("TestWebhookDialog", () => {
	function renderDialog(webhook: typeof WEBHOOK | null = WEBHOOK) {
		const onOpenChange = vi.fn();
		const onDelivered = vi.fn();
		render(
			<TestWebhookDialog
				open
				webhook={webhook}
				onOpenChange={onOpenChange}
				onDelivered={onDelivered}
			/>,
		);
		return { onOpenChange, onDelivered };
	}

	it("says that a deploy hook starts a build", () => {
		renderDialog();
		expect(
			screen.getByRole("heading", { name: "Send a test to Site?" }),
		).toBeTruthy();
		expect(
			screen.getByText(/example.com\/…c3d4. A deploy hook starts a build/),
		).toBeTruthy();
	});

	it("sends the test, gives the delivery, then closes", async () => {
		client.testWebhookOfCms.mockResolvedValue(R.Ok(DELIVERY));
		const { onOpenChange, onDelivered } = renderDialog();
		await userEvent.click(
			screen.getByRole("button", { name: "Send the test" }),
		);
		expect(onDelivered).toHaveBeenCalledWith("w1", DELIVERY);
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("shows why a test failed, and stays open", async () => {
		client.testWebhookOfCms.mockResolvedValue(R.Error("not-found"));
		const { onDelivered } = renderDialog();
		await userEvent.click(
			screen.getByRole("button", { name: "Send the test" }),
		);
		expect(screen.getByRole("alert").textContent).toBe(MESSAGES["not-found"]);
		expect(onDelivered).not.toHaveBeenCalled();
	});

	it("does nothing with no webhook", async () => {
		renderDialog(null);
		expect(
			screen.getByRole("heading", { name: "Send a test to the webhook?" }),
		).toBeTruthy();
		await userEvent.click(
			screen.getByRole("button", { name: "Send the test" }),
		);
		expect(client.testWebhookOfCms).not.toHaveBeenCalled();
	});

	it("clears an error when it closes", async () => {
		client.testWebhookOfCms.mockResolvedValue(R.Error("offline"));
		const { onOpenChange } = renderDialog();
		await userEvent.click(
			screen.getByRole("button", { name: "Send the test" }),
		);
		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});

describe("RemoveWebhookDialog", () => {
	function renderDialog(webhook: typeof WEBHOOK | null = WEBHOOK) {
		const onOpenChange = vi.fn();
		const onRemoved = vi.fn();
		render(
			<RemoveWebhookDialog
				open
				webhook={webhook}
				onOpenChange={onOpenChange}
				onRemoved={onRemoved}
			/>,
		);
		return { onOpenChange, onRemoved };
	}

	it("removes the webhook, then closes", async () => {
		client.removeWebhook.mockResolvedValue(R.Ok(true));
		const { onOpenChange, onRemoved } = renderDialog();
		expect(screen.getByRole("heading", { name: "Remove Site?" })).toBeTruthy();
		await userEvent.click(
			screen.getByRole("button", { name: "Remove the webhook" }),
		);
		expect(onRemoved).toHaveBeenCalledWith("w1");
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("shows why a remove failed", async () => {
		client.removeWebhook.mockResolvedValue(R.Error("offline"));
		const { onRemoved } = renderDialog();
		await userEvent.click(
			screen.getByRole("button", { name: "Remove the webhook" }),
		);
		expect(screen.getByRole("alert").textContent).toBe(MESSAGES.offline);
		expect(onRemoved).not.toHaveBeenCalled();
	});

	it("does nothing with no webhook", async () => {
		renderDialog(null);
		await userEvent.click(
			screen.getByRole("button", { name: "Remove the webhook" }),
		);
		expect(client.removeWebhook).not.toHaveBeenCalled();
	});

	it("closes on Cancel", async () => {
		const { onOpenChange } = renderDialog();
		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});
