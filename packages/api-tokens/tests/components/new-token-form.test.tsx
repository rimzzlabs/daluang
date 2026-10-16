// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewTokenForm } from "../../src/components/new-token-form";

const client = vi.hoisted(() => ({
	createApiToken: vi.fn(),
	TOKENS_ERROR_MESSAGES: {
		invalid: "Invalid.",
		"too-many": "Too many.",
		"signed-out": "Signed out.",
		offline: "Offline.",
		server: "Server.",
	},
}));
vi.mock("../../src/client", () => client);

const TOKEN = {
	id: "t1",
	name: "Build",
	start: "dlg_AbCd",
	createdAt: "2026-10-17T12:00:00.000Z",
	lastUsedAt: null,
};

beforeEach(() => {
	client.createApiToken.mockReset();
});

describe("NewTokenForm", () => {
	it("asks for a name", async () => {
		render(<NewTokenForm onCreated={() => {}} />);
		await userEvent.click(screen.getByRole("button", { name: "Make a token" }));
		expect(screen.getByRole("alert").textContent).toBe(
			"Give the token a name, for example the name of your site.",
		);
		expect(client.createApiToken).not.toHaveBeenCalled();
	});

	it("makes a token with the trimmed name, and clears the field", async () => {
		const created = { token: TOKEN, secret: "dlg_secret" };
		client.createApiToken.mockResolvedValue(R.Ok(created));
		const onCreated = vi.fn();
		render(<NewTokenForm onCreated={onCreated} />);
		await userEvent.type(screen.getByLabelText("Token name"), "  Build ");
		await userEvent.click(screen.getByRole("button", { name: "Make a token" }));
		expect(client.createApiToken).toHaveBeenCalledWith("Build");
		expect(onCreated).toHaveBeenCalledWith(created);
		expect(screen.getByLabelText("Token name")).toHaveProperty("value", "");
	});

	it("shows why a token was not made", async () => {
		client.createApiToken.mockResolvedValue(R.Error("too-many"));
		render(<NewTokenForm onCreated={() => {}} />);
		await userEvent.type(screen.getByLabelText("Token name"), "Build");
		await userEvent.click(screen.getByRole("button", { name: "Make a token" }));
		expect(screen.getByRole("alert").textContent).toBe("Too many.");
	});
});
