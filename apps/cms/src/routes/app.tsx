import type { CmsSettings } from "@daluang/settings/settings";
import { readSidebarPreferences } from "@daluang/ui/lib/sidebar-preferences";
import { RouterProvider } from "@tanstack/react-router";
import { useState } from "react";
import { createChangesStore } from "@/lib/notes/changes-store";
import { createSettingsStore } from "@/lib/settings/settings-store";
import { type AppRouterContext, createAppRouter } from "./router";

export interface AppProps extends Pick<AppRouterContext, "user"> {
	/** The settings of the server. The island keeps them in a store. */
	settings: CmsSettings;
	/** The number of changes of the server. The island keeps it in a store. */
	changeCount: number;
}

/**
 * The root of the app island. The client router shows the page of the path in the frame of
 * the app. The island starts once, and a click on a menu item changes only the page.
 */
export function App(props: AppProps) {
	const [router] = useState(() =>
		createAppRouter({
			context: {
				user: props.user,
				sidebar: readSidebarPreferences(),
				settings: createSettingsStore(props.settings),
				changes: createChangesStore(props.changeCount),
			},
		}),
	);
	return <RouterProvider router={router} />;
}
