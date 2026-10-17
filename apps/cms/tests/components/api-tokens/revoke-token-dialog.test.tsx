// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RevokeTokenDialog } from "@/components/api-tokens/revoke-token-dialog";
import { MESSAGES, stubScreen, TOKEN } from "./client-mock";

const client = vi.hoisted(() => ({
	revokeApiToken: vi.fn(),
	TOKENS_ERROR_MESSAGES: {
		invalid: "Invalid.",
		"too-many": "Too many.",
		"signed-out": "Signed out.",
		offline: "Offline.",
		server: "Server.",
	},
}));
vi.mock("@daluang/api-tokens/client", () => client);

beforeEach(() => {
	client.revokeApiToken.mockReset();
});

afterEach(() => {
	stubScreen("desktop");
});

function renderDialog() {
	const onOpenChange = vi.fn();
	const onRevoked = vi.fn();
	render(
		<RevokeTokenDialog
			open
			token={TOKEN}
			onOpenChange={onOpenChange}
			onRevoked={onRevoked}
		/>,
	);
	return { onOpenChange, onRevoked };
}

describe("RevokeTokenDialog", () => {
	it("asks before a revoke, and says what a site loses", () => {
		renderDialog();
		expect(screen.getByRole("heading", { name: "Revoke Build?" })).toBeTruthy();
		expect(screen.getByText(/can no longer read the posts/)).toBeTruthy();
	});

	it("revokes the token, then closes", async () => {
		client.revokeApiToken.mockResolvedValue(R.Ok(true));
		const { onOpenChange, onRevoked } = renderDialog();
		await userEvent.click(
			screen.getByRole("button", { name: "Revoke the token" }),
		);
		expect(client.revokeApiToken).toHaveBeenCalledWith("t1");
		expect(onRevoked).toHaveBeenCalledWith("t1");
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("shows why a revoke failed, and stays open", async () => {
		client.revokeApiToken.mockResolvedValue(R.Error("signed-out"));
		const { onRevoked } = renderDialog();
		await userEvent.click(
			screen.getByRole("button", { name: "Revoke the token" }),
		);
		expect(screen.getByRole("alert").textContent).toBe(MESSAGES["signed-out"]);
		expect(onRevoked).not.toHaveBeenCalled();
	});

	it("does nothing with no token", async () => {
		render(
			<RevokeTokenDialog
				open
				token={null}
				onOpenChange={() => {}}
				onRevoked={() => {}}
			/>,
		);
		expect(
			screen.getByRole("heading", { name: "Revoke the token?" }),
		).toBeTruthy();
		await userEvent.click(
			screen.getByRole("button", { name: "Revoke the token" }),
		);
		expect(client.revokeApiToken).not.toHaveBeenCalled();
	});

	it("opens as a drawer on a phone, with the same question and buttons", async () => {
		stubScreen("phone");
		const { onOpenChange } = renderDialog();
		expect(document.querySelector("[data-slot=drawer-popup]")).not.toBeNull();
		expect(screen.getByText("Revoke Build?")).toBeTruthy();
		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});
