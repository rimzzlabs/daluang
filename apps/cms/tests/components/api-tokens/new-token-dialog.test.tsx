// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewTokenDialog } from "@/components/api-tokens/new-token-dialog";
import { MESSAGES, TOKEN } from "./client-mock";

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
vi.mock("@/lib/api-tokens/client", () => client);

beforeEach(() => {
	client.createApiToken.mockReset();
});

function renderDialog() {
	const onOpenChange = vi.fn();
	const onCreated = vi.fn();
	render(
		<NewTokenDialog open onOpenChange={onOpenChange} onCreated={onCreated} />,
	);
	return { onOpenChange, onCreated };
}

describe("NewTokenDialog", () => {
	it("asks for a name", async () => {
		renderDialog();
		await userEvent.click(
			screen.getByRole("button", { name: "Make the token" }),
		);
		expect(screen.getByRole("alert").textContent).toBe(
			"Give the token a name, for example the name of your site.",
		);
		expect(client.createApiToken).not.toHaveBeenCalled();
	});

	it("makes a token, then shows it one time with a copy button", async () => {
		const created = { token: TOKEN, secret: "dlg_secret" };
		client.createApiToken.mockResolvedValue(R.Ok(created));
		const user = userEvent.setup();
		const { onCreated, onOpenChange } = renderDialog();
		await user.type(screen.getByLabelText("Token name"), "  Build ");
		await user.click(screen.getByRole("button", { name: "Make the token" }));
		expect(client.createApiToken).toHaveBeenCalledWith("Build");
		expect(onCreated).toHaveBeenCalledWith(created);
		expect(
			screen.getByRole("heading", { name: "Copy the token of “Build”" }),
		).toBeTruthy();
		expect(screen.getByText("dlg_secret")).toBeTruthy();
		await user.click(screen.getByRole("button", { name: "Copy the token" }));
		await expect(navigator.clipboard.readText()).resolves.toBe("dlg_secret");
		expect(screen.getByRole("status").textContent).toBe(
			"The token is on your clipboard.",
		);
		await user.click(screen.getByRole("button", { name: "Done" }));
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("asks the writer to copy by hand when the browser refuses", async () => {
		client.createApiToken.mockResolvedValue(
			R.Ok({ token: TOKEN, secret: "dlg_secret" }),
		);
		const user = userEvent.setup();
		renderDialog();
		await user.type(screen.getByLabelText("Token name"), "Build");
		await user.click(screen.getByRole("button", { name: "Make the token" }));
		vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
			new Error("Refused"),
		);
		await user.click(screen.getByRole("button", { name: "Copy the token" }));
		expect(screen.getByRole("status").textContent).toBe(
			"Select the token, then copy it.",
		);
	});

	it("shows why a token was not made", async () => {
		client.createApiToken.mockResolvedValue(R.Error("too-many"));
		renderDialog();
		await userEvent.type(screen.getByLabelText("Token name"), "Build");
		await userEvent.click(
			screen.getByRole("button", { name: "Make the token" }),
		);
		expect(screen.getByRole("alert").textContent).toBe(MESSAGES["too-many"]);
	});

	it("closes on Cancel", async () => {
		const { onOpenChange } = renderDialog();
		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});
