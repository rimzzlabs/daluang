export interface LaterPageProps {
	title: string;
	description: string;
}

/** The body of a page that has a menu item but no feature yet. It says what the page will do. */
export function LaterPage(props: LaterPageProps) {
	return (
		<section className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
			<h1 className="font-serif text-2xl font-semibold tracking-tight">
				{props.title}
			</h1>
			<p className="mt-2 text-pretty text-muted-foreground">
				{props.description}
			</p>
			<p className="mt-4 text-sm text-muted-foreground">
				This page comes in a later step.
			</p>
		</section>
	);
}
