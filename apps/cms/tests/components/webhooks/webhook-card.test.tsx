// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WebhookCard } from "@/components/webhooks/webhook-card";
import { WEBHOOK } from "./fixtures";

describe("WebhookCard", () => {
	it("asks the page to send a test or to remove the webhook", async () => {
		const onTest = vi.fn();
		const onRemove = vi.fn();
		render(
			<ul>
				<WebhookCard webhook={WEBHOOK} onTest={onTest} onRemove={onRemove} />
			</ul>,
		);
		expect(screen.getByText("example.com/…c3d4")).toBeTruthy();
		await userEvent.click(
			screen.getByRole("button", { name: "Send a test to Site" }),
		);
		await userEvent.click(screen.getByRole("button", { name: "Remove Site" }));
		expect(onTest).toHaveBeenCalledWith(WEBHOOK);
		expect(onRemove).toHaveBeenCalledWith(WEBHOOK);
	});
});
