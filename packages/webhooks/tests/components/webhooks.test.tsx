// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Webhooks } from "../../src/components/webhooks";

const client = vi.hoisted(() => ({
	listWebhooksOfCms: vi.fn(),
	addWebhook: vi.fn(),
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

const WEBHOOK = {
	id: "w1",
	name: "Site",
	urlHint: "example.com/…c3d4",
	createdAt: "2026-10-17T00:00:00.000Z",
	deliveries: [],
};

const DELIVERY = {
	id: "d1",
	event: "test",
	status: "delivered",
	statusCode: 200,
	durationMs: 12,
	createdAt: "2026-10-17T00:00:00.000Z",
};

beforeEach(() => {
	for (const mock of [
		client.listWebhooksOfCms,
		client.addWebhook,
		client.removeWebhook,
		client.testWebhookOfCms,
	])
		mock.mockReset();
});

describe("Webhooks", () => {
	it("shows a loading state, then the empty state", async () => {
		client.listWebhooksOfCms.mockResolvedValue(R.Ok([]));
		render(<Webhooks />);
		expect(screen.getByText("Loading the webhooks")).toBeTruthy();
		expect(await screen.findByText(/No webhooks yet/)).toBeTruthy();
	});

	it("shows why the list failed, and tries again", async () => {
		client.listWebhooksOfCms.mockResolvedValueOnce(R.Error("server"));
		client.listWebhooksOfCms.mockResolvedValueOnce(R.Ok([WEBHOOK]));
		render(<Webhooks />);
		expect((await screen.findByRole("alert")).textContent).toContain("Server.");
		await userEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(await screen.findByText("example.com/…c3d4")).toBeTruthy();
	});

	it("adds a webhook to the list", async () => {
		client.listWebhooksOfCms.mockResolvedValue(R.Ok([]));
		client.addWebhook.mockResolvedValue(R.Ok(WEBHOOK));
		render(<Webhooks />);
		await screen.findByText(/No webhooks yet/);
		await userEvent.type(screen.getByLabelText("Webhook name"), "Site");
		await userEvent.type(screen.getByLabelText("URL"), "https://example.com/a");
		await userEvent.click(
			screen.getByRole("button", { name: "Add the webhook" }),
		);
		expect(await screen.findByText("example.com/…c3d4")).toBeTruthy();
	});

	it("adds no webhook to a list that did not load", async () => {
		client.listWebhooksOfCms.mockResolvedValue(R.Error("server"));
		client.addWebhook.mockResolvedValue(R.Ok(WEBHOOK));
		render(<Webhooks />);
		await screen.findByText("Server.");
		await userEvent.type(screen.getByLabelText("Webhook name"), "Site");
		await userEvent.type(screen.getByLabelText("URL"), "https://example.com/a");
		await userEvent.click(
			screen.getByRole("button", { name: "Add the webhook" }),
		);
		expect(screen.queryByText("example.com/…c3d4")).toBeNull();
		expect(screen.getByText("Server.")).toBeTruthy();
	});

	it("ignores the list when the page closes before it loads", async () => {
		const loaded = Promise.withResolvers<unknown>();
		client.listWebhooksOfCms.mockReturnValue(loaded.promise);
		const { unmount } = render(<Webhooks />);
		unmount();
		loaded.resolve(R.Ok([WEBHOOK]));
		await loaded.promise;
		expect(screen.queryByText("example.com/…c3d4")).toBeNull();
	});

	it("shows the delivery of a test, and removes the webhook", async () => {
		client.listWebhooksOfCms.mockResolvedValue(R.Ok([WEBHOOK]));
		client.testWebhookOfCms.mockResolvedValue(R.Ok(DELIVERY));
		client.removeWebhook.mockResolvedValue(R.Ok(true));
		render(<Webhooks />);
		await userEvent.click(
			await screen.findByRole("button", { name: "Send a test to Site" }),
		);
		expect(await screen.findByText("Delivered")).toBeTruthy();
		await userEvent.click(screen.getByRole("button", { name: "Remove Site" }));
		await userEvent.click(
			screen.getByRole("button", { name: "Remove Site now" }),
		);
		expect(await screen.findByText(/No webhooks yet/)).toBeTruthy();
	});
});
