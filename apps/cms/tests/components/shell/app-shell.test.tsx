import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppShell } from "@/components/shell/app-shell";

const user = { name: "Rizki Citra", githubLogin: "rimzzlabs", image: null };

describe("AppShell", () => {
	it("frames the page with the sidebar and the navbar", () => {
		render(
			<AppShell
				title="Notes"
				pathname="/"
				user={user}
				defaultOpen
				defaultWidth={18}
			>
				<p>No notes yet</p>
			</AppShell>,
		);
		expect(screen.getByText("No notes yet")).toBeTruthy();
		expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();
		expect(
			screen.getByRole("button", { name: "Account menu of rimzzlabs" }),
		).toBeTruthy();
		const wrapper = document.querySelector<HTMLElement>(
			"[data-slot=sidebar-wrapper]",
		);
		expect(wrapper?.style.getPropertyValue("--sidebar-width")).toBe("18rem");
	});

	it("renders the sidebar collapsed when the cookie says so", () => {
		render(
			<AppShell
				title="Notes"
				pathname="/"
				user={user}
				defaultOpen={false}
				defaultWidth={16}
			/>,
		);
		expect(
			document.querySelector("[data-slot=sidebar]")?.getAttribute("data-state"),
		).toBe("collapsed");
	});
});
