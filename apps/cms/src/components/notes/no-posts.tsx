import { Button, buttonVariants } from "@daluang/ui/components/button";
import { FileArrowUpIcon, PlusIcon } from "@phosphor-icons/react";
import type { Ref } from "react";
import { NavLink, type NavLinkKind } from "@/components/shell/nav-link";

export interface NoPostsProps {
	linkKind: NavLinkKind;
	/** Opens the dialog that imports Markdown or MDX files. */
	onImport: () => void;
	/** The Import button, so the dialog can give the focus back to it. */
	importRef?: Ref<HTMLButtonElement>;
}

/** The posts page with no post: a link to write the first post, and the import of files. */
export function NoPosts(props: NoPostsProps) {
	return (
		<section className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
			<h1 className="font-serif text-2xl font-semibold tracking-tight">
				No posts yet
			</h1>
			<p className="mt-2 text-pretty text-muted-foreground">
				Write your first post in Markdown. Your posts will show here.
			</p>
			<div className="mt-6 flex flex-wrap justify-center gap-2">
				<Button
					ref={props.importRef}
					type="button"
					variant="outline"
					onClick={props.onImport}
				>
					<FileArrowUpIcon data-icon="inline-start" />
					Import
				</Button>
				<NavLink
					kind={props.linkKind}
					href="/posts/new"
					className={buttonVariants()}
				>
					<PlusIcon data-icon="inline-start" />
					New post
				</NavLink>
			</div>
		</section>
	);
}
