import type { UserMenuProps } from "@daluang/auth/components/user-menu";
import { SidebarInset, SidebarProvider } from "@daluang/ui/components/sidebar";
import { TooltipProvider } from "@daluang/ui/components/tooltip";
import type { ReactNode } from "react";
import { AppNavbar } from "./app-navbar";
import { AppSidebar } from "./app-sidebar";

export interface AppShellProps {
	title: string;
	pathname: string;
	user: UserMenuProps;
	/** From the `sidebar_state` cookie, so the server renders the saved state. */
	defaultOpen: boolean;
	/** From the `sidebar_width` cookie, in rem. */
	defaultWidth: number;
	/** The page. Astro renders it as HTML, and the island does not hydrate it. */
	children?: ReactNode;
}

/**
 * The frame of each signed-in page: the sidebar, the navbar, and the page in between. It is
 * one island, because the sidebar, its trigger, and its rail share the state of the sidebar.
 */
export function AppShell(props: AppShellProps) {
	return (
		<TooltipProvider>
			<SidebarProvider
				defaultOpen={props.defaultOpen}
				defaultWidth={props.defaultWidth}
			>
				<AppSidebar pathname={props.pathname} />
				<SidebarInset>
					<AppNavbar title={props.title} user={props.user} />
					<div className="flex flex-1 flex-col">{props.children}</div>
				</SidebarInset>
			</SidebarProvider>
		</TooltipProvider>
	);
}
