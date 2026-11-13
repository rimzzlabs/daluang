import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { NavLinkKind } from "@/components/shell/nav-link";

export interface PostLinkProps {
	kind: NavLinkKind;
	/** The ID of the post. */
	id: string;
	className?: string;
	/** `page` on the link of the open post. */
	"aria-current"?: "page";
	children: ReactNode;
}

/** A link to the page of a post: a router link in the app island, or a plain link. */
export function PostLink(props: PostLinkProps) {
	if (props.kind === "router")
		return (
			<Link
				to="/posts/$id"
				params={{ id: props.id }}
				aria-current={props["aria-current"]}
				className={props.className}
			>
				{props.children}
			</Link>
		);
	return (
		<a
			href={`/posts/${encodeURIComponent(props.id)}`}
			aria-current={props["aria-current"]}
			className={props.className}
		>
			{props.children}
		</a>
	);
}
