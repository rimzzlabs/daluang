import { buttonVariants } from "@daluang/ui/components/button";
import { PlusIcon } from "@phosphor-icons/react";
import { NavLink, type NavLinkKind } from "@/components/shell/nav-link";

export interface NoPostsProps {
	linkKind: NavLinkKind;
}

/** The posts page with no post: a link to write the first post. */
export function NoPosts(props: NoPostsProps) {
	return (
		<section className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
			<h1 className="font-serif text-2xl font-semibold tracking-tight">
				No posts yet
			</h1>
			<p className="mt-2 text-pretty text-muted-foreground">
				Write your first post in Markdown. Your posts will show here.
			</p>
			<NavLink
				kind={props.linkKind}
				href="/posts/new"
				className={buttonVariants({ className: "mt-6" })}
			>
				<PlusIcon data-icon="inline-start" />
				New post
			</NavLink>
		</section>
	);
}
