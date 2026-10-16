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
	ImagesIcon,
	KeyIcon,
	NotePencilIcon,
	TranslateIcon,
	WebhooksLogoIcon,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";
import type { AppPagePath } from "@/lib/app-pages";
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
			{ label: "Notes", href: "/", icon: NotePencilIcon },
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
			{ label: "Languages", href: "/settings/languages", icon: TranslateIcon },
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
}

export function AppSidebar(props: AppSidebarProps) {
	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							render={navLinkElement({ kind: props.linkKind, href: "/" })}
							tooltip="Daluang"
						>
							<span className="flex size-8 shrink-0 items-center justify-center">
								<DaluangMark className="h-5 w-auto" />
							</span>
							<span className="font-semibold">Daluang</span>
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
