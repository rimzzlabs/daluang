// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { AppShell } from "@/components/shell/app-shell";
import { createChangesStore } from "@/lib/notes/changes-store";
import { settingsStore } from "../../settings";

const user = { name: "Rizki Citra", githubLogin: "rimzzlabs", image: null };

describe("AppShell", () => {
	it("frames the page with the sidebar and the navbar", () => {
		render(
			<AppShell
				title="Posts"
				pathname="/"
				user={user}
				defaultOpen
				defaultWidth={18}
				linkKind="anchor"
				settings={settingsStore()}
				changes={createChangesStore(0)}
			>
				<p>No posts yet</p>
			</AppShell>,
		);
		expect(screen.getByText("No posts yet")).toBeTruthy();
		expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();
		expect(
			screen.getByRole("button", { name: "Account menu of rimzzlabs" }),
		).toBeTruthy();
		const wrapper = document.querySelector<HTMLElement>(
			"[data-slot=sidebar-wrapper]",
		);
		expect(wrapper?.style.getPropertyValue("--sidebar-width")).toBe("18rem");
	});

	it("renders the sidebar collapsed when it is stored collapsed", () => {
		render(
			<AppShell
				title="Posts"
				pathname="/"
				user={user}
				defaultOpen={false}
				defaultWidth={16}
				linkKind="anchor"
				settings={settingsStore()}
				changes={createChangesStore(0)}
			/>,
		);
		expect(
			document.querySelector("[data-slot=sidebar]")?.getAttribute("data-state"),
		).toBe("collapsed");
	});

	it("folds the sidebar on the editor, and keeps the stored state", async () => {
		function shell(pathname: string): ReactElement {
			return (
				<AppShell
					title="Edit post"
					pathname={pathname}
					user={user}
					defaultOpen
					defaultWidth={16}
					linkKind="anchor"
					settings={settingsStore()}
					changes={createChangesStore(0)}
				/>
			);
		}
		function state(): string | null | undefined {
			return document
				.querySelector("[data-slot=sidebar]")
				?.getAttribute("data-state");
		}
		localStorage.clear();
		const { rerender } = render(shell("/posts/n1"));
		expect(state()).toBe("collapsed");
		await userEvent.click(
			screen.getByRole("button", { name: "Toggle the sidebar" }),
		);
		expect(state()).toBe("expanded");
		await userEvent.click(
			screen.getByRole("button", { name: "Toggle the sidebar" }),
		);
		expect(state()).toBe("collapsed");
		expect(localStorage.getItem("daluang:sidebar-state")).toBeNull();
		rerender(shell("/posts"));
		expect(state()).toBe("expanded");
	});
});
