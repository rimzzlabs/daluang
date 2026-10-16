import type { UserMenuProps } from "@daluang/auth/components/user-menu";
import {
	createRootRouteWithContext,
	createRoute,
	createRouter,
	type RouterHistory,
} from "@tanstack/react-router";
import { AppRoot } from "./app-root";
import { NotFoundPage } from "./not-found-page";
import { PAGE_COMPONENTS } from "./page-content";

/** What each route can read from the router, from the props of the island. */
export interface AppRouterContext {
	user: UserMenuProps;
	/** The stored open state and width of the sidebar. */
	sidebar: { open: boolean; width: number };
}

// The root route is the frame: the sidebar and the navbar stay while the page changes.
const rootRoute = createRootRouteWithContext<AppRouterContext>()({
	component: AppRoot,
	notFoundComponent: NotFoundPage,
});

const notesRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: PAGE_COMPONENTS["/"],
});

const mediaRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/media",
	component: PAGE_COMPONENTS["/media"],
});

const apiTokensRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/settings/api-tokens",
	component: PAGE_COMPONENTS["/settings/api-tokens"],
});

const webhooksRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/settings/webhooks",
	component: PAGE_COMPONENTS["/settings/webhooks"],
});

const languagesRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/settings/languages",
	component: PAGE_COMPONENTS["/settings/languages"],
});

export const routeTree = rootRoute.addChildren([
	notesRoute,
	mediaRoute,
	apiTokensRoute,
	webhooksRoute,
	languagesRoute,
]);

export interface AppRouterOptions {
	context: AppRouterContext;
	/** The browser history by default. A test gives a memory history. */
	history?: RouterHistory;
}

export function createAppRouter(options: AppRouterOptions) {
	return createRouter({
		routeTree,
		context: options.context,
		...(options.history ? { history: options.history } : {}),
		// A pointer on a link loads the page before the click.
		defaultPreload: "intent",
	});
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof createAppRouter>;
	}
}
