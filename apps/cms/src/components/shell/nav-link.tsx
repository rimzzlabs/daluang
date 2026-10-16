import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import type { AppPagePath } from "@/lib/app-pages";

/**
 * How a menu item navigates. Inside the app island, the client router opens the page. In
 * the HTML that the server sends before the island starts, a plain link does it.
 */
export type NavLinkKind = "router" | "anchor";

export interface NavLinkRequest {
	kind: NavLinkKind;
	href: AppPagePath;
}

/** The element of a menu item, for the `render` prop of `SidebarMenuButton`. */
export function navLinkElement(request: NavLinkRequest): ReactElement {
	if (request.kind === "router") return <Link to={request.href} />;
	// biome-ignore lint/a11y/useAnchorContent: the menu button puts its label in this link.
	return <a href={request.href} />;
}
