import { useRouteContext, useRouterState } from "@tanstack/react-router";
import type { AppPagePath } from "@/lib/shell/app-pages";
import { PAGE_COMPONENTS } from "./page-content";

/**
 * The route component of a page. It gives the page the values of the router context, as
 * the server gives them to `PageContent`.
 */
export function routePage(path: AppPagePath) {
	const Page = PAGE_COMPONENTS[path];
	function RoutePage() {
		const context = useRouteContext({ from: "__root__" });
		const pathname = useRouterState({
			select: (state) => state.location.pathname,
		});
		return (
			<Page
				settings={context.settings}
				changes={context.changes}
				linkKind="router"
				pathname={pathname}
			/>
		);
	}
	return RoutePage;
}
