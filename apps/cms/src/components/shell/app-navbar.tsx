import { Separator } from "@daluang/ui/components/separator";
import { SidebarTrigger } from "@daluang/ui/components/sidebar";
import { ThemeToggle } from "@daluang/ui/components/theme-toggle";
import { UserMenu, type UserMenuProps } from "@/components/auth/user-menu";

export interface AppNavbarProps {
	title: string;
	user: UserMenuProps;
}

export function AppNavbar(props: AppNavbarProps) {
	return (
		<header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-3">
			<SidebarTrigger />
			<Separator
				orientation="vertical"
				className="mx-1 h-4 data-vertical:self-center"
			/>
			<p className="truncate text-sm font-medium">{props.title}</p>
			<div className="ml-auto flex items-center gap-1">
				<ThemeToggle />
				<UserMenu {...props.user} />
			</div>
		</header>
	);
}
