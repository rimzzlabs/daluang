import type { ListedNote } from "@daluang/notes/note-list";
import { noteCounts } from "@daluang/notes/note-list";
import { languageLabel } from "@daluang/settings/language-label";
import { A } from "@mobily/ts-belt";

export interface PostCountsProps {
	posts: readonly ListedNote[];
	/** The language tags of the CMS, in the order of the setting. */
	languages: readonly string[];
}

interface CountRow {
	label: string;
	count: number;
}

function CountList(props: { label: string; rows: readonly CountRow[] }) {
	return (
		<dl aria-label={props.label} className="grid grid-cols-2 gap-y-2 text-sm">
			{A.map(props.rows, (row) => (
				<div key={row.label} className="contents">
					<dt className="text-muted-foreground">{row.label}</dt>
					<dd className="text-right font-medium tabular-nums">{row.count}</dd>
				</div>
			))}
		</dl>
	);
}

/** The number of drafts and of published posts, then the number in each language. */
export function PostCounts(props: PostCountsProps) {
	const counts = noteCounts(
		A.map(props.posts, (post) => post.note),
		props.languages,
	);
	return (
		<div className="flex flex-col gap-3">
			<CountList
				label="Posts by status"
				rows={[
					{ label: "Drafts", count: counts.drafts },
					{ label: "Published", count: counts.published },
				]}
			/>
			<div className="border-t border-border pt-3">
				<CountList
					label="Posts by language"
					rows={A.map(counts.languages, (item) => ({
						label: languageLabel(item.language),
						count: item.count,
					}))}
				/>
			</div>
		</div>
	);
}
