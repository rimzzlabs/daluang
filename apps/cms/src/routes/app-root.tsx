import {
	Outlet,
	useRouteContext,
	useRouterState,
} from "@tanstack/react-router";
import { useEffect, useLayoutEffect } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { documentTitle, pageTitle } from "@/lib/shell/app-pages";

/** The component of the root route: the frame of the app, with the page of the path in it. */
export function AppRoot() {
	const context = useRouteContext({ from: "__root__" });
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const title = pageTitle(pathname);

	// The server sends the frame as HTML beside the island. Delete it before the first paint
	// of the island, so the person sees one frame the whole time.
	useLayoutEffect(() => {
		document.querySelector("[data-static-shell]")?.remove();
	}, []);

	// The browser keeps the title of the first page. A client navigation sets the new one.
	useEffect(() => {
		document.title = documentTitle(title);
	}, [title]);

	return (
		<AppShell
			title={title}
			pathname={pathname}
			user={context.user}
			defaultOpen={context.sidebar.open}
			defaultWidth={context.sidebar.width}
			linkKind="router"
			settings={context.settings}
		>
			<Outlet />
		</AppShell>
	);
}
