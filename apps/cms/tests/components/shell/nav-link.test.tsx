// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NavLink, navLinkElement } from "@/components/shell/nav-link";

describe("navLinkElement", () => {
	it("gives a plain link for the HTML of the server", () => {
		const { container } = render(
			navLinkElement({ kind: "anchor", href: "/media" }),
		);
		expect(container.querySelector("a")?.getAttribute("href")).toBe("/media");
	});
});

describe("NavLink", () => {
	it("gives a plain link with its content for the HTML of the server", () => {
		const { container } = render(
			<NavLink kind="anchor" href="/media" className="card">
				Media
			</NavLink>,
		);
		const link = container.querySelector("a");
		expect(link?.getAttribute("href")).toBe("/media");
		expect(link?.className).toBe("card");
		expect(link?.textContent).toBe("Media");
	});
});
