import type { SettingsStore } from "@daluang/settings/settings-store";
import { O } from "@mobily/ts-belt";
import type { ReactElement } from "react";
import { type AppPagePath, findAppPage } from "@/lib/app-pages";
import { ApiTokensPage, MediaPage, WebhooksPage } from "./later-pages";
import { NotesPage } from "./notes-page";
import { LanguagesPage, SitePage } from "./settings-pages";

/** What each page gets: the server and the router give the same values. */
export interface AppPageProps {
	settings: SettingsStore;
}

/** The component of each page. The router and the HTML of the server use the same map. */
export const PAGE_COMPONENTS: Record<
	AppPagePath,
	(props: AppPageProps) => ReactElement
> = {
	"/": NotesPage,
	"/media": MediaPage,
	"/settings/api-tokens": ApiTokensPage,
	"/settings/webhooks": WebhooksPage,
	"/settings/site": SitePage,
	"/settings/languages": LanguagesPage,
};

export interface PageContentProps extends AppPageProps {
	pathname: string;
}

/**
 * The page of a path, for the HTML that the server sends before the island starts. A path
 * with no page shows nothing: the router shows its "not found" page when it starts.
 */
export function PageContent(props: PageContentProps) {
	const page = findAppPage(props.pathname);
	if (O.isNone(page)) return null;
	const Page = PAGE_COMPONENTS[page.path];
	return <Page settings={props.settings} />;
}
