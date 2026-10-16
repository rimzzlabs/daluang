// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { navLinkElement } from "@/components/shell/nav-link";

describe("navLinkElement", () => {
	it("gives a plain link for the HTML of the server", () => {
		const { container } = render(
			navLinkElement({ kind: "anchor", href: "/media" }),
		);
		expect(container.querySelector("a")?.getAttribute("href")).toBe("/media");
	});
});
