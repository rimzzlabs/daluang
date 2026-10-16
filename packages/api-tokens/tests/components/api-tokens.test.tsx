// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiTokens } from "../../src/components/api-tokens";

const client = vi.hoisted(() => ({
	listApiTokens: vi.fn(),
	createApiToken: vi.fn(),
	revokeApiToken: vi.fn(),
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
	client.listApiTokens.mockReset();
	client.createApiToken.mockReset();
	client.revokeApiToken.mockReset();
});

describe("ApiTokens", () => {
	it("shows a loading state, then the tokens", async () => {
		client.listApiTokens.mockResolvedValue(R.Ok([TOKEN]));
		render(<ApiTokens />);
		expect(screen.getByText("Loading the tokens")).toBeTruthy();
		expect(await screen.findByText("Build")).toBeTruthy();
	});

	it("shows why the list failed, and tries again", async () => {
		client.listApiTokens.mockResolvedValueOnce(R.Error("offline"));
		client.listApiTokens.mockResolvedValueOnce(R.Ok([]));
		render(<ApiTokens />);
		expect((await screen.findByRole("alert")).textContent).toContain(
			"Offline.",
		);
		await userEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(await screen.findByText(/No tokens yet/)).toBeTruthy();
	});

	it("shows a new token one time, adds it to the list, and closes the panel", async () => {
		client.listApiTokens.mockResolvedValue(R.Ok([]));
		client.createApiToken.mockResolvedValue(
			R.Ok({ token: TOKEN, secret: "dlg_secret" }),
		);
		render(<ApiTokens />);
		await screen.findByText(/No tokens yet/);
		await userEvent.type(screen.getByLabelText("Token name"), "Build");
		await userEvent.click(screen.getByRole("button", { name: "Make a token" }));
		expect(await screen.findByText("dlg_secret")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Revoke Build" })).toBeTruthy();
		await userEvent.click(screen.getByRole("button", { name: "Done" }));
		expect(screen.queryByText("dlg_secret")).toBeNull();
	});

	it("closes the panel when the writer revokes the new token", async () => {
		client.listApiTokens.mockResolvedValue(R.Ok([]));
		client.createApiToken.mockResolvedValue(
			R.Ok({ token: TOKEN, secret: "dlg_secret" }),
		);
		client.revokeApiToken.mockResolvedValue(R.Ok(true));
		render(<ApiTokens />);
		await screen.findByText(/No tokens yet/);
		await userEvent.type(screen.getByLabelText("Token name"), "Build");
		await userEvent.click(screen.getByRole("button", { name: "Make a token" }));
		await userEvent.click(
			await screen.findByRole("button", { name: "Revoke Build" }),
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Revoke Build now" }),
		);
		expect(await screen.findByText(/No tokens yet/)).toBeTruthy();
		expect(screen.queryByText("dlg_secret")).toBeNull();
	});

	it("shows a new token also when the list did not load", async () => {
		client.listApiTokens.mockResolvedValue(R.Error("server"));
		client.createApiToken.mockResolvedValue(
			R.Ok({ token: TOKEN, secret: "dlg_secret" }),
		);
		render(<ApiTokens />);
		await screen.findByText("Server.");
		await userEvent.type(screen.getByLabelText("Token name"), "Build");
		await userEvent.click(screen.getByRole("button", { name: "Make a token" }));
		expect(await screen.findByText("dlg_secret")).toBeTruthy();
	});
});
