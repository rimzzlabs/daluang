// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TokenList } from "../../src/components/token-list";

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
vi.mock("../../src/client", () => client);

const TOKEN = {
	id: "t1",
	name: "Build",
	start: "dlg_AbCd",
	createdAt: "2026-10-17T12:00:00.000Z",
	lastUsedAt: null,
};

beforeEach(() => {
	client.revokeApiToken.mockReset();
});

describe("TokenList", () => {
	it("says that there is no token", () => {
		render(<TokenList tokens={[]} onRevoked={() => {}} />);
		expect(screen.getByText(/No tokens yet/)).toBeTruthy();
	});

	it("shows the start of each token and its last use", () => {
		render(
			<TokenList
				tokens={[
					TOKEN,
					{ ...TOKEN, id: "t2", lastUsedAt: "2026-10-17T12:00:00.000Z" },
				]}
				onRevoked={() => {}}
			/>,
		);
		expect(screen.getAllByText("dlg_AbCd…")).toHaveLength(2);
		expect(screen.getByText(/Never used/)).toBeTruthy();
		expect(screen.getByText(/Used Oct 1[67], 2026/)).toBeTruthy();
	});

	it("asks one time more before a revoke, and keeps the token on Keep", async () => {
		const onRevoked = vi.fn();
		render(<TokenList tokens={[TOKEN]} onRevoked={onRevoked} />);
		await userEvent.click(screen.getByRole("button", { name: "Revoke Build" }));
		await userEvent.click(screen.getByRole("button", { name: "Keep" }));
		expect(screen.getByRole("button", { name: "Revoke Build" })).toBeTruthy();
		expect(client.revokeApiToken).not.toHaveBeenCalled();
	});

	it("revokes a token", async () => {
		client.revokeApiToken.mockResolvedValue(R.Ok(true));
		const onRevoked = vi.fn();
		render(<TokenList tokens={[TOKEN]} onRevoked={onRevoked} />);
		await userEvent.click(screen.getByRole("button", { name: "Revoke Build" }));
		await userEvent.click(
			screen.getByRole("button", { name: "Revoke Build now" }),
		);
		expect(client.revokeApiToken).toHaveBeenCalledWith("t1");
		expect(onRevoked).toHaveBeenCalledWith("t1");
	});

	it("shows why a revoke failed", async () => {
		client.revokeApiToken.mockResolvedValue(R.Error("signed-out"));
		render(<TokenList tokens={[TOKEN]} onRevoked={() => {}} />);
		await userEvent.click(screen.getByRole("button", { name: "Revoke Build" }));
		await userEvent.click(
			screen.getByRole("button", { name: "Revoke Build now" }),
		);
		expect(screen.getByRole("alert").textContent).toBe("Signed out.");
	});
});
