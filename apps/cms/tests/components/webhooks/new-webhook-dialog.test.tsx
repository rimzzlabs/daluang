// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewWebhookDialog } from "@/components/webhooks/new-webhook-dialog";
import { MESSAGES, WEBHOOK } from "./fixtures";

const client = vi.hoisted(() => ({
	addWebhook: vi.fn(),
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
	client.addWebhook.mockReset();
});

function renderDialog() {
	const onOpenChange = vi.fn();
	const onAdded = vi.fn();
	render(
		<NewWebhookDialog open onOpenChange={onOpenChange} onAdded={onAdded} />,
	);
	return { onOpenChange, onAdded };
}

async function fill(name: string, url: string) {
	if (name !== "")
		await userEvent.type(screen.getByLabelText("Webhook name"), name);
	await userEvent.type(screen.getByLabelText("URL"), url);
	await userEvent.click(
		screen.getByRole("button", { name: "Add the webhook" }),
	);
}

describe("NewWebhookDialog", () => {
	it("shows the error of each field, and sends nothing", async () => {
		renderDialog();
		await fill("", "http://127.0.0.1");
		const alerts = screen
			.getAllByRole("alert")
			.map((alert) => alert.textContent);
		expect(alerts[0]).toContain("Give the webhook a name");
		expect(alerts[1]).toContain("https URL");
		expect(client.addWebhook).not.toHaveBeenCalled();
	});

	it("adds the webhook, then closes", async () => {
		client.addWebhook.mockResolvedValue(R.Ok(WEBHOOK));
		const { onAdded, onOpenChange } = renderDialog();
		await fill("Site", "https://example.com/a");
		expect(client.addWebhook).toHaveBeenCalledWith({
			name: "Site",
			url: "https://example.com/a",
		});
		expect(onAdded).toHaveBeenCalledWith(WEBHOOK);
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("shows why the webhook was not added, and stays open", async () => {
		client.addWebhook.mockResolvedValue(R.Error("too-many"));
		const { onOpenChange } = renderDialog();
		await fill("Site", "https://example.com/a");
		expect(screen.getByRole("alert").textContent).toBe(MESSAGES["too-many"]);
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	it("closes on Cancel", async () => {
		const { onOpenChange } = renderDialog();
		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});
