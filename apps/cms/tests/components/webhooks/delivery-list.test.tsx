// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeliveryList } from "@/components/webhooks/delivery-list";

const BASE = {
	id: "d1",
	event: "test" as const,
	durationMs: 12,
	createdAt: "2026-10-17T00:00:00.000Z",
};

describe("DeliveryList", () => {
	it("says that there is no delivery", () => {
		render(<DeliveryList deliveries={[]} />);
		expect(screen.getByText(/No deliveries yet/)).toBeTruthy();
	});

	it("shows the result of each delivery", () => {
		render(
			<DeliveryList
				deliveries={[
					{ ...BASE, status: "delivered", statusCode: 200 },
					{ ...BASE, id: "d2", status: "failed", statusCode: null },
				]}
			/>,
		);
		expect(screen.getByText("Delivered")).toBeTruthy();
		expect(screen.getByText("Failed")).toBeTruthy();
		expect(screen.getByText("HTTP 200 · 12 ms")).toBeTruthy();
		expect(screen.getByText("No answer · 12 ms")).toBeTruthy();
	});
});
