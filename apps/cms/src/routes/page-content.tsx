import { O } from "@mobily/ts-belt";
import type { ReactElement } from "react";
import type { NavLinkKind } from "@/components/shell/nav-link";
import { type AppPagePath, findAppPage } from "@/lib/app-pages";
import type { SettingsStore } from "@/lib/settings/settings-store";
import { ApiTokensPage } from "./api-tokens-page";
import { MediaPage } from "./later-pages";
import { NotesPage } from "./notes-page";
import { FieldsPage, LanguagesPage, SitePage } from "./settings-pages";
import { WebhooksPage } from "./webhooks-page";

/** What each page gets: the server and the router give the same values. */
export interface AppPageProps {
	settings: SettingsStore;
	/** `anchor` in the HTML of the server, `router` in the app island. */
	linkKind: NavLinkKind;
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
	"/settings/fields": FieldsPage,
};

export interface PageContentProps extends Pick<AppPageProps, "settings"> {
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
	return <Page settings={props.settings} linkKind="anchor" />;
}
