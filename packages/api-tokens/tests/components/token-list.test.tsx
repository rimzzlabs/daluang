// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TokenList } from "../../src/components/token-list";
import { TOKEN } from "./client-mock";

describe("TokenList", () => {
	it("shows the start of each token and its last use", () => {
		render(
			<TokenList
				tokens={[
					TOKEN,
					{ ...TOKEN, id: "t2", lastUsedAt: "2026-10-17T12:00:00.000Z" },
				]}
				onRevoke={() => {}}
			/>,
		);
		expect(screen.getAllByText("dlg_AbCd…")).toHaveLength(2);
		expect(screen.getByText(/Never used/)).toBeTruthy();
		expect(screen.getByText(/Used Oct 1[67], 2026/)).toBeTruthy();
	});

	it("asks the page to revoke a token", async () => {
		const onRevoke = vi.fn();
		render(<TokenList tokens={[TOKEN]} onRevoke={onRevoke} />);
		await userEvent.click(screen.getByRole("button", { name: "Revoke Build" }));
		expect(onRevoke).toHaveBeenCalledWith(TOKEN);
	});
});
