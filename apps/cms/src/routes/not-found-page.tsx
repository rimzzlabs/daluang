import { buttonVariants } from "@daluang/ui/components/button";
import { Link } from "@tanstack/react-router";

export function NotFoundPage() {
	return (
		<section className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
			<h1 className="font-serif text-2xl font-semibold tracking-tight">
				Page not found
			</h1>
			<p className="mt-2 text-pretty text-muted-foreground">
				No page of Daluang has this address.
			</p>
			<Link
				to="/posts"
				className={buttonVariants({ variant: "outline", className: "mt-6" })}
			>
				Go to the posts
			</Link>
		</section>
	);
}
