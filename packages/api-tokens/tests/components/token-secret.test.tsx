// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TokenSecret } from "../../src/components/token-secret";

function renderSecret() {
	const onDone = vi.fn();
	render(<TokenSecret name="Build" secret="dlg_secret" onDone={onDone} />);
	return onDone;
}

describe("TokenSecret", () => {
	it("copies the token", async () => {
		const user = userEvent.setup();
		renderSecret();
		await user.click(screen.getByRole("button", { name: "Copy the token" }));
		expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();
		await expect(navigator.clipboard.readText()).resolves.toBe("dlg_secret");
	});

	it("asks the writer to copy by hand when the browser refuses", async () => {
		const user = userEvent.setup();
		renderSecret();
		vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
			new Error("Refused"),
		);
		await user.click(screen.getByRole("button", { name: "Copy the token" }));
		expect(screen.getByRole("status").textContent).toBe(
			"Select the token, then copy it.",
		);
	});

	it("closes on Done", async () => {
		const onDone = renderSecret();
		await userEvent.click(screen.getByRole("button", { name: "Done" }));
		expect(onDone).toHaveBeenCalledOnce();
	});
});
