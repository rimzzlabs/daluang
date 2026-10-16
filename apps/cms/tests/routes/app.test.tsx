// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "@/routes/app";

const props = {
	user: { name: "Rizki Citra", githubLogin: "rimzzlabs", image: null },
};

function openAt(path: string) {
	window.history.pushState({}, "", path);
	render(<App {...props} />);
}

describe("App", () => {
	it("shows the page of the address in the frame of the app", async () => {
		openAt("/");
		expect(
			await screen.findByRole("heading", { name: "No notes yet" }),
		).toBeTruthy();
		expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();
		expect(
			screen.getByRole("link", { name: "Notes" }).hasAttribute("data-active"),
		).toBe(true);
	});

	it("deletes the HTML frame of the server when the island shows its frame", async () => {
		document.body.insertAdjacentHTML(
			"beforeend",
			"<div data-static-shell></div>",
		);
		openAt("/");
		await screen.findByRole("heading", { name: "No notes yet" });
		expect(document.querySelector("[data-static-shell]")).toBeNull();
	});

	it("changes only the page on a menu click, with the title of the new page", async () => {
		openAt("/");
		await screen.findByRole("heading", { name: "No notes yet" });
		const sidebar = screen.getByRole("navigation", { name: "Main" });
		await userEvent.click(screen.getByRole("link", { name: "Webhooks" }));
		expect(
			await screen.findByRole("heading", { name: "Webhooks" }),
		).toBeTruthy();
		expect(window.location.pathname).toBe("/settings/webhooks");
		expect(document.title).toBe("Webhooks · Daluang");
		expect(screen.getByRole("navigation", { name: "Main" })).toBe(sidebar);
		expect(
			screen
				.getByRole("link", { name: "Webhooks" })
				.hasAttribute("data-active"),
		).toBe(true);
	});

	it("shows the not-found page for an address with no page, with a way back", async () => {
		openAt("/nope");
		expect(
			await screen.findByRole("heading", { name: "Page not found" }),
		).toBeTruthy();
		await userEvent.click(
			screen.getByRole("link", { name: "Go to the notes" }),
		);
		expect(
			await screen.findByRole("heading", { name: "No notes yet" }),
		).toBeTruthy();
	});

	it("opens the sidebar in its stored state and width", async () => {
		localStorage.setItem("daluang:sidebar-state", "collapsed");
		localStorage.setItem("daluang:sidebar-width", "20");
		openAt("/");
		await screen.findByRole("heading", { name: "No notes yet" });
		expect(
			document.querySelector("[data-slot=sidebar]")?.getAttribute("data-state"),
		).toBe("collapsed");
		const wrapper = document.querySelector<HTMLElement>(
			"[data-slot=sidebar-wrapper]",
		);
		expect(wrapper?.style.getPropertyValue("--sidebar-width")).toBe("20rem");
		localStorage.clear();
	});
});
