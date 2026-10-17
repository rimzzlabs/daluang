// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiTokens } from "../../src/components/api-tokens";
import { TOKEN } from "./client-mock";

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

beforeEach(() => {
	client.listApiTokens.mockReset();
	client.createApiToken.mockReset();
	client.revokeApiToken.mockReset();
});

describe("ApiTokens", () => {
	it("shows a loading state, then the empty state with its action", async () => {
		client.listApiTokens.mockResolvedValue(R.Ok([]));
		render(<ApiTokens />);
		expect(screen.getByText("Loading the tokens")).toBeTruthy();
		expect(await screen.findByText("No tokens yet")).toBeTruthy();
		expect(
			screen.getAllByRole("button", { name: "Make a token" }),
		).toHaveLength(2);
	});

	it("shows why the list failed, and tries again", async () => {
		client.listApiTokens.mockResolvedValueOnce(R.Error("offline"));
		client.listApiTokens.mockResolvedValueOnce(R.Ok([TOKEN]));
		render(<ApiTokens />);
		expect((await screen.findByRole("alert")).textContent).toContain(
			"Offline.",
		);
		await userEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(await screen.findByText("Build")).toBeTruthy();
	});

	it("makes a token in a dialog, and adds it to the list", async () => {
		client.listApiTokens.mockResolvedValue(R.Ok([]));
		client.createApiToken.mockResolvedValue(
			R.Ok({ token: TOKEN, secret: "dlg_secret" }),
		);
		render(<ApiTokens />);
		await screen.findByText("No tokens yet");
		const [headerButton] = screen.getAllByRole("button", {
			name: "Make a token",
		});
		if (headerButton === undefined) throw new Error("No button.");
		await userEvent.click(headerButton);
		const dialog = screen.getByRole("dialog");
		await userEvent.type(within(dialog).getByLabelText("Token name"), "Build");
		await userEvent.click(
			within(dialog).getByRole("button", { name: "Make the token" }),
		);
		expect(await screen.findByText("dlg_secret")).toBeTruthy();
		await userEvent.click(screen.getByRole("button", { name: "Done" }));
		expect(
			(await screen.findByRole("list", { name: "API tokens" })).textContent,
		).toContain("Build");
	});

	it("revokes a token after a confirmation, and keeps the others", async () => {
		const other = { ...TOKEN, id: "t2", name: "Other" };
		client.listApiTokens.mockResolvedValue(R.Ok([TOKEN, other]));
		client.revokeApiToken.mockResolvedValue(R.Ok(true));
		render(<ApiTokens />);
		await userEvent.click(
			await screen.findByRole("button", { name: "Revoke Build" }),
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Revoke the token" }),
		);
		const list = await screen.findByRole("list", { name: "API tokens" });
		expect(within(list).queryByText("Build")).toBeNull();
		expect(within(list).getByText("Other")).toBeTruthy();
	});

	it("adds no token to a list that did not load", async () => {
		client.listApiTokens.mockResolvedValue(R.Error("server"));
		client.createApiToken.mockResolvedValue(
			R.Ok({ token: TOKEN, secret: "dlg_secret" }),
		);
		render(<ApiTokens />);
		await screen.findByText("Server.");
		await userEvent.click(screen.getByRole("button", { name: "Make a token" }));
		await userEvent.type(screen.getByLabelText("Token name"), "Build");
		await userEvent.click(
			screen.getByRole("button", { name: "Make the token" }),
		);
		expect(await screen.findByText("dlg_secret")).toBeTruthy();
		expect(screen.queryByRole("list", { name: "API tokens" })).toBeNull();
	});
});
