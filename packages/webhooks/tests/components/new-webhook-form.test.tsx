// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewWebhookForm } from "../../src/components/new-webhook-form";

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
vi.mock("../../src/client", () => client);

beforeEach(() => {
	client.addWebhook.mockReset();
});

describe("NewWebhookForm", () => {
	it("shows the error of each field, and sends nothing", async () => {
		render(<NewWebhookForm onAdded={() => {}} />);
		await userEvent.type(screen.getByLabelText("URL"), "http://127.0.0.1");
		await userEvent.click(
			screen.getByRole("button", { name: "Add the webhook" }),
		);
		const alerts = screen
			.getAllByRole("alert")
			.map((alert) => alert.textContent);
		expect(alerts[0]).toContain("Give the webhook a name");
		expect(alerts[1]).toContain("https URL");
		expect(client.addWebhook).not.toHaveBeenCalled();
	});

	it("adds the webhook and clears the fields", async () => {
		const webhook = { id: "w1" };
		client.addWebhook.mockResolvedValue(R.Ok(webhook));
		const onAdded = vi.fn();
		render(<NewWebhookForm onAdded={onAdded} />);
		await userEvent.type(screen.getByLabelText("Webhook name"), "Site");
		await userEvent.type(screen.getByLabelText("URL"), "https://example.com/a");
		await userEvent.click(
			screen.getByRole("button", { name: "Add the webhook" }),
		);
		expect(client.addWebhook).toHaveBeenCalledWith({
			name: "Site",
			url: "https://example.com/a",
		});
		expect(onAdded).toHaveBeenCalledWith(webhook);
		expect(screen.getByLabelText("URL")).toHaveProperty("value", "");
	});

	it("shows why the webhook was not added", async () => {
		client.addWebhook.mockResolvedValue(R.Error("too-many"));
		render(<NewWebhookForm onAdded={() => {}} />);
		await userEvent.type(screen.getByLabelText("Webhook name"), "Site");
		await userEvent.type(screen.getByLabelText("URL"), "https://example.com/a");
		await userEvent.click(
			screen.getByRole("button", { name: "Add the webhook" }),
		);
		expect(screen.getByRole("alert").textContent).toBe("Too many.");
	});
});
