import { DaluangMark } from "@daluang/ui/components/daluang-mark";
import { Sidebar, SidebarRail } from "@daluang/ui/components/sidebar";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@daluang/ui/components/sidebar-menu";
import {
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
} from "@daluang/ui/components/sidebar-sections";
import {
	GlobeSimpleIcon,
	ImagesIcon,
	KeyIcon,
	ListDashesIcon,
	NotePencilIcon,
	SquaresFourIcon,
	TranslateIcon,
	WebhooksLogoIcon,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";
import { useSettings } from "@/hooks/settings/use-settings";
import type { SettingsStore } from "@/lib/settings/settings-store";
import type { AppPagePath } from "@/lib/shell/app-pages";
import { type NavLinkKind, navLinkElement } from "./nav-link";

interface NavItem {
	label: string;
	href: AppPagePath;
	icon: ComponentType;
}

interface NavGroup {
	label: string;
	items: readonly NavItem[];
}

// The menus of the CMS. Each item has a page in `APP_PAGES` and a route in `routes/router.ts`.
export const NAV_GROUPS: readonly NavGroup[] = [
	{
		label: "Write",
		items: [
			{ label: "Dashboard", href: "/", icon: SquaresFourIcon },
			{ label: "Posts", href: "/posts", icon: NotePencilIcon },
			{ label: "Media", href: "/media", icon: ImagesIcon },
		],
	},
	{
		label: "Publish",
		items: [
			{ label: "API tokens", href: "/settings/api-tokens", icon: KeyIcon },
			{ label: "Webhooks", href: "/settings/webhooks", icon: WebhooksLogoIcon },
		],
	},
	{
		label: "Settings",
		items: [
			{ label: "Site", href: "/settings/site", icon: GlobeSimpleIcon },
			{ label: "Languages", href: "/settings/languages", icon: TranslateIcon },
			{ label: "Fields", href: "/settings/fields", icon: ListDashesIcon },
		],
	},
];

/** True when `pathname` is the page of `href` or a page below it. `/` matches only itself. */
export function isActivePath(pathname: string, href: string): boolean {
	if (href === "/") return pathname === "/";
	return pathname === href || pathname.startsWith(`${href}/`);
}

export interface AppSidebarProps {
	pathname: string;
	linkKind: NavLinkKind;
	settings: SettingsStore;
}

export function AppSidebar(props: AppSidebarProps) {
	const { site } = useSettings(props.settings);
	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							render={navLinkElement({ kind: props.linkKind, href: "/" })}
							tooltip={site.name}
						>
							<span className="flex size-8 shrink-0 items-center justify-center">
								<DaluangMark className="h-5 w-auto" />
							</span>
							<span className="grid min-w-0 flex-1 leading-tight">
								<span className="truncate font-semibold">Daluang</span>
								<span className="truncate text-xs text-muted-foreground">
									{site.name}
								</span>
							</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<nav aria-label="Main">
					{NAV_GROUPS.map((group) => (
						<SidebarGroup key={group.label}>
							<SidebarGroupLabel>{group.label}</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									{group.items.map((item) => (
										<SidebarMenuItem key={item.href}>
											<SidebarMenuButton
												render={navLinkElement({
													kind: props.linkKind,
													href: item.href,
												})}
												isActive={isActivePath(props.pathname, item.href)}
												tooltip={item.label}
											>
												<item.icon />
												<span>{item.label}</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
									))}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					))}
				</nav>
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}
