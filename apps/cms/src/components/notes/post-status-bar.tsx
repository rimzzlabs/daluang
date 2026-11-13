import { bodyStats } from "@daluang/notes/body-stats";
import { Spinner } from "@daluang/ui/components/spinner";
import { match } from "ts-pattern";

// The interface is in English, so the numbers have the English group mark: 1,234.
const NUMBER = new Intl.NumberFormat("en-US");

/** The save of the post, as the status bar shows it. */
export type SaveState =
	| { status: "idle" }
	| { status: "saving" }
	| { status: "saved" }
	| { status: "failed"; message: string };

function counted(count: number, word: string): string {
	return `${NUMBER.format(count)} ${word}${count === 1 ? "" : "s"}`;
}

export interface PostStatusBarProps {
	body: string;
	save: SaveState;
}

/**
 * The bar below the post: the words, the characters, and the read time of the body, then
 * the state of the save.
 */
export function PostStatusBar(props: PostStatusBarProps) {
	const stats = bodyStats(props.body);
	return (
		<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
			<p>
				{counted(stats.words, "word")} ·{" "}
				{counted(stats.characters, "character")} · {stats.readMinutes} min read
			</p>
			{match(props.save)
				.with({ status: "idle" }, () => null)
				.with({ status: "saving" }, () => (
					<p role="status" className="flex items-center gap-1.5">
						<Spinner aria-hidden className="size-3" />
						Saving
					</p>
				))
				.with({ status: "saved" }, () => <p role="status">Saved</p>)
				.with({ status: "failed" }, (failed) => (
					<p role="alert" className="text-destructive">
						{failed.message}
					</p>
				))
				.exhaustive()}
		</div>
	);
}
