import type { SettingsStore } from "@daluang/settings/settings-store";
import {
	createRootRouteWithContext,
	createRoute,
	createRouter,
	type RouterHistory,
} from "@tanstack/react-router";
import type { UserMenuProps } from "@/components/auth/user-menu";
import { AppRoot } from "./app-root";
import { NotFoundPage } from "./not-found-page";
import { routePage } from "./route-page";

/** What each route can read from the router, from the props of the island. */
export interface AppRouterContext {
	user: UserMenuProps;
	/** The stored open state and width of the sidebar. */
	sidebar: { open: boolean; width: number };
	/** The settings of the CMS. A settings page writes to it after a save. */
	settings: SettingsStore;
}

// The root route is the frame: the sidebar and the navbar stay while the page changes.
const rootRoute = createRootRouteWithContext<AppRouterContext>()({
	component: AppRoot,
	notFoundComponent: NotFoundPage,
});

const notesRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: routePage("/"),
});

const mediaRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/media",
	component: routePage("/media"),
});

const apiTokensRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/settings/api-tokens",
	component: routePage("/settings/api-tokens"),
});

const webhooksRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/settings/webhooks",
	component: routePage("/settings/webhooks"),
});

const siteRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/settings/site",
	component: routePage("/settings/site"),
});

const languagesRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/settings/languages",
	component: routePage("/settings/languages"),
});

const fieldsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/settings/fields",
	component: routePage("/settings/fields"),
});

export const routeTree = rootRoute.addChildren([
	notesRoute,
	mediaRoute,
	apiTokensRoute,
	webhooksRoute,
	siteRoute,
	languagesRoute,
	fieldsRoute,
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
