import { readSidebarPreferences } from "@daluang/ui/lib/sidebar-preferences";
import { RouterProvider } from "@tanstack/react-router";
import { useState } from "react";
import { type AppRouterContext, createAppRouter } from "./router";

export type AppProps = Pick<AppRouterContext, "user">;

/**
 * The root of the app island. The client router shows the page of the path in the frame of
 * the app. The island starts once, and a click on a menu item changes only the page.
 */
export function App(props: AppProps) {
	const [router] = useState(() =>
		createAppRouter({
			context: { user: props.user, sidebar: readSidebarPreferences() },
		}),
	);
	return <RouterProvider router={router} />;
}
