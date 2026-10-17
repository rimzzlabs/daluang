// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Webhooks } from "@/components/webhooks/webhooks";
import { DELIVERY, WEBHOOK } from "./fixtures";

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
vi.mock("@daluang/webhooks/client", () => client);

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
	it("shows a loading state, then the empty state, with one primary action", async () => {
		client.listWebhooksOfCms.mockResolvedValue(R.Ok([]));
		render(<Webhooks />);
		expect(screen.getByText("Loading the webhooks")).toBeTruthy();
		expect(await screen.findByText("No webhooks yet")).toBeTruthy();
		expect(
			screen.getAllByRole("button", { name: "Add a webhook" }),
		).toHaveLength(1);
	});

	it("shows why the list failed, and tries again", async () => {
		client.listWebhooksOfCms.mockResolvedValueOnce(R.Error("server"));
		client.listWebhooksOfCms.mockResolvedValueOnce(R.Ok([WEBHOOK]));
		render(<Webhooks />);
		expect((await screen.findByRole("alert")).textContent).toContain("Server.");
		await userEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(await screen.findByText("example.com/…c3d4")).toBeTruthy();
	});

	it("adds a webhook in a dialog", async () => {
		client.listWebhooksOfCms.mockResolvedValue(R.Ok([]));
		client.addWebhook.mockResolvedValue(R.Ok(WEBHOOK));
		render(<Webhooks />);
		await screen.findByText("No webhooks yet");
		await userEvent.click(
			screen.getByRole("button", { name: "Add a webhook" }),
		);
		const dialog = screen.getByRole("dialog");
		await userEvent.type(within(dialog).getByLabelText("Webhook name"), "Site");
		await userEvent.type(
			within(dialog).getByLabelText("URL"),
			"https://example.com/a",
		);
		await userEvent.click(
			within(dialog).getByRole("button", { name: "Add the webhook" }),
		);
		expect(await screen.findByText("example.com/…c3d4")).toBeTruthy();
	});

	it("sends a test after a confirmation, and keeps the 5 newest deliveries", async () => {
		const old = [1, 2, 3, 4, 5].map((index) => ({
			...DELIVERY,
			id: `d${index}`,
		}));
		const other = {
			...WEBHOOK,
			id: "w2",
			name: "Other",
			urlHint: "b.com/…zzzz",
		};
		client.listWebhooksOfCms.mockResolvedValue(
			R.Ok([{ ...WEBHOOK, deliveries: old }, other]),
		);
		client.testWebhookOfCms.mockResolvedValue(
			R.Ok({ ...DELIVERY, id: "new", status: "failed", statusCode: 500 }),
		);
		render(<Webhooks />);
		await userEvent.click(
			await screen.findByRole("button", { name: "Send a test to Site" }),
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Send the test" }),
		);
		expect(await screen.findByText(/HTTP 500/)).toBeTruthy();
		expect(screen.getAllByText("Delivered")).toHaveLength(4);
		expect(screen.getByText("b.com/…zzzz")).toBeTruthy();
	});

	it("removes a webhook after a confirmation", async () => {
		client.listWebhooksOfCms.mockResolvedValue(R.Ok([WEBHOOK]));
		client.removeWebhook.mockResolvedValue(R.Ok(true));
		render(<Webhooks />);
		await userEvent.click(
			await screen.findByRole("button", { name: "Remove Site" }),
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Remove the webhook" }),
		);
		expect(await screen.findByText("No webhooks yet")).toBeTruthy();
	});

	it("adds no webhook to a list that did not load", async () => {
		client.listWebhooksOfCms.mockResolvedValue(R.Error("server"));
		client.addWebhook.mockResolvedValue(R.Ok(WEBHOOK));
		render(<Webhooks />);
		await screen.findByText("Server.");
		await userEvent.click(
			screen.getByRole("button", { name: "Add a webhook" }),
		);
		await userEvent.type(screen.getByLabelText("Webhook name"), "Site");
		await userEvent.type(screen.getByLabelText("URL"), "https://example.com/a");
		await userEvent.click(
			screen.getByRole("button", { name: "Add the webhook" }),
		);
		expect(await screen.findByText("Server.")).toBeTruthy();
		expect(screen.queryByText("example.com/…c3d4")).toBeNull();
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
});
