import type { UserMenuProps } from "@daluang/auth/components/user-menu";
import type { SettingsStore } from "@daluang/settings/settings-store";
import { SidebarInset, SidebarProvider } from "@daluang/ui/components/sidebar";
import { TooltipProvider } from "@daluang/ui/components/tooltip";
import type { ReactNode } from "react";
import { AppNavbar } from "./app-navbar";
import { AppSidebar } from "./app-sidebar";
import type { NavLinkKind } from "./nav-link";

export interface AppShellProps {
	title: string;
	pathname: string;
	user: UserMenuProps;
	/** The stored open state of the sidebar. */
	defaultOpen: boolean;
	/** The stored width of the sidebar, in rem. */
	defaultWidth: number;
	/** `router` inside the app island, `anchor` in the HTML of the server. */
	linkKind: NavLinkKind;
	settings: SettingsStore;
	children?: ReactNode;
}

/**
 * The frame of each signed-in page: the sidebar, the navbar, and the page in between. The
 * root route of the app island renders it. The server also renders it, as the HTML that
 * shows before the island starts, and the two give the same HTML.
 */
export function AppShell(props: AppShellProps) {
	return (
		<TooltipProvider>
			<SidebarProvider
				defaultOpen={props.defaultOpen}
				defaultWidth={props.defaultWidth}
			>
				<AppSidebar
					pathname={props.pathname}
					linkKind={props.linkKind}
					settings={props.settings}
				/>
				<SidebarInset>
					<AppNavbar title={props.title} user={props.user} />
					<div className="flex flex-1 flex-col">{props.children}</div>
				</SidebarInset>
			</SidebarProvider>
		</TooltipProvider>
	);
}
