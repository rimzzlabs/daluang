// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UserMenu } from "@/components/auth/user-menu";

const client = vi.hoisted(() => ({
	startGitHubSignIn: vi.fn(),
	signOut: vi.fn(),
}));
vi.mock("@daluang/auth/client", () => client);

describe("UserMenu", () => {
	it("shows the initials of the name when there is no avatar", () => {
		render(
			<UserMenu
				name="Rizki Citra Pratama"
				githubLogin="rimzzlabs"
				image={null}
			/>,
		);
		expect(screen.getByText("RC")).toBeTruthy();
	});

	it("shows the name and the GitHub username, and signs out", async () => {
		render(
			<UserMenu
				name="Rizki Citra"
				githubLogin="rimzzlabs"
				image="https://avatars.example/rimzzlabs.png"
			/>,
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Account menu of rimzzlabs" }),
		);
		expect(await screen.findByText("Rizki Citra")).toBeTruthy();
		expect(screen.getByText("@rimzzlabs")).toBeTruthy();
		await userEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
		expect(client.signOut).toHaveBeenCalledOnce();
	});
});
