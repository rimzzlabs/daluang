// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignInButton } from "@/components/auth/sign-in-button";

const client = vi.hoisted(() => ({
	startGitHubSignIn: vi.fn(),
	signOut: vi.fn(),
}));
vi.mock("@/lib/auth/client", () => client);

describe("SignInButton", () => {
	beforeEach(() => {
		client.startGitHubSignIn.mockReset();
	});

	it("starts the sign-in with GitHub and returns to next", async () => {
		client.startGitHubSignIn.mockReturnValue(new Promise(() => {}));
		render(<SignInButton next="/notes" />);
		await userEvent.click(
			screen.getByRole("button", { name: "Continue with GitHub" }),
		);
		expect(client.startGitHubSignIn).toHaveBeenCalledWith("/notes");
		expect(
			screen.getByRole("button", { name: "Opening GitHub…" }),
		).toHaveProperty("disabled", true);
	});

	it("stays on the pending state when Better Auth sends the browser to GitHub", async () => {
		client.startGitHubSignIn.mockResolvedValue({
			data: { redirect: true },
			error: null,
		});
		render(<SignInButton next="/" />);
		await userEvent.click(
			screen.getByRole("button", { name: "Continue with GitHub" }),
		);
		expect(screen.getByRole("status").textContent).toBe("");
		expect(
			screen.getByRole("button", { name: "Opening GitHub…" }),
		).toBeTruthy();
	});

	it("shows a failure when Better Auth answers with an error", async () => {
		client.startGitHubSignIn.mockResolvedValue({
			data: null,
			error: { status: 500 },
		});
		render(<SignInButton next="/" />);
		await userEvent.click(
			screen.getByRole("button", { name: "Continue with GitHub" }),
		);
		expect(
			await screen.findByText("Daluang could not reach GitHub. Try again."),
		).toBeTruthy();
	});

	it("shows a failure when the request throws", async () => {
		client.startGitHubSignIn.mockRejectedValue(new Error("offline"));
		render(<SignInButton next="/" />);
		await userEvent.click(
			screen.getByRole("button", { name: "Continue with GitHub" }),
		);
		expect(
			await screen.findByText("Daluang could not reach GitHub. Try again."),
		).toBeTruthy();
		expect(
			screen.getByRole("button", { name: "Continue with GitHub" }),
		).toBeTruthy();
	});
});
