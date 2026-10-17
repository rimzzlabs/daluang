import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@daluang/ui/components/avatar";
import { Button } from "@daluang/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@daluang/ui/components/dropdown-menu";
import { A, pipe, S } from "@mobily/ts-belt";
import { SignOutIcon } from "@phosphor-icons/react";
import { signOut } from "@/lib/auth/client";

export interface UserMenuProps {
	name: string;
	githubLogin: string;
	image: string | null;
}

function initials(name: string): string {
	return pipe(
		name,
		S.trim,
		S.split(" "),
		A.take(2),
		A.map(S.slice(0, 1)),
		A.map(S.toUpperCase),
		A.join(""),
	);
}

/** The avatar of the signed-in person, with a menu to sign out. */
export function UserMenu(props: UserMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						size="icon"
						aria-label={`Account menu of ${props.githubLogin}`}
					/>
				}
			>
				<Avatar size="sm">
					{props.image === null ? null : (
						<AvatarImage src={props.image} alt="" />
					)}
					<AvatarFallback>{initials(props.name)}</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuGroup>
					<DropdownMenuLabel className="flex flex-col">
						<span className="truncate text-foreground">{props.name}</span>
						<span className="truncate font-normal text-muted-foreground">
							@{props.githubLogin}
						</span>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={signOut}>
						<SignOutIcon />
						Sign out
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
