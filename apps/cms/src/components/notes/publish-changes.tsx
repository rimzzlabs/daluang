import { Badge } from "@daluang/ui/components/badge";
import { Button } from "@daluang/ui/components/button";
import {
	ResponsiveDialog,
	ResponsiveDialogClose,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogFooter,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
} from "@daluang/ui/components/responsive-dialog";
import { Skeleton } from "@daluang/ui/components/skeleton";
import { Spinner } from "@daluang/ui/components/spinner";
import { A, R } from "@mobily/ts-belt";
import { UploadSimpleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { match } from "ts-pattern";
import { AUTOSAVE_RETRY_SECONDS } from "@/hooks/notes/use-autosave";
import { useChangeCount } from "@/hooks/notes/use-change-count";
import { CHANGE_LABELS } from "@/lib/notes/change-labels";
import type { ChangesStore } from "@/lib/notes/changes-store";
import {
	type AutosaveOutcome,
	type ChangeItem,
	listChangesOfCms,
	NOTES_ERROR_MESSAGES,
	publishChanges,
} from "@/lib/notes/client";

export interface PublishChangesProps {
	changes: ChangesStore;
}

type DialogState =
	| { status: "loading" }
	| { status: "ready"; items: readonly ChangeItem[] }
	| { status: "publishing"; items: readonly ChangeItem[] }
	| { status: "failed"; items: readonly ChangeItem[]; message: string }
	// No list that was read after a save of the open post: a click reads it again.
	| { status: "stale"; items: readonly ChangeItem[]; message: string };

/** The message of each save of the open post that does not succeed before Publish changes. */
export const OPEN_POST_MESSAGES: Record<
	Exclude<AutosaveOutcome, "saved">,
	string
> = {
	refused:
		"The open post has a value that is not correct. Correct the post, then publish again.",
	failed: `Daluang could not save the open post. Daluang tries again in ${AUTOSAVE_RETRY_SECONDS} seconds. Then publish again.`,
};

function plural(count: number): string {
	return count === 1 ? "1 change" : `${count} changes`;
}

/**
 * The button of Publish changes in the navbar, with the number of changes. It opens the
 * list of the changes, and a publish of all of them. With no change, it shows nothing.
 * It saves the open post before it lists and before it publishes. It publishes only a list
 * that it read after a save that succeeded. Else, Publish changes saves the post and reads
 * the list again, and the writer publishes the new list.
 */
export function PublishChanges(props: PublishChangesProps) {
	const count = useChangeCount(props.changes);
	const [open, setOpen] = useState(false);
	const [state, setState] = useState<DialogState>({ status: "loading" });

	async function openList() {
		setOpen(true);
		setState({ status: "loading" });
		// The open post saves first, so the list shows the change of its last text.
		const saved = await props.changes.saveOpenPost();
		const list = await listChangesOfCms();
		R.match(
			list,
			(value) => {
				props.changes.write(value.count);
				const items = value.changes;
				if (saved === "saved") {
					setState({ status: "ready", items });
					return;
				}
				const message = OPEN_POST_MESSAGES[saved];
				setState({ status: "stale", items, message });
			},
			(error) =>
				setState({
					status: "stale",
					items: [],
					message: NOTES_ERROR_MESSAGES[error],
				}),
		);
	}

	async function publish() {
		// A save after the list can add a change, so the writer must see the new list first.
		if (state.status === "stale") {
			await openList();
			return;
		}
		if (state.status !== "ready" && state.status !== "failed") return;
		const { items } = state;
		setState({ status: "publishing", items });
		// A save can still run, for example a retry of a failed save. It must end first.
		const saved = await props.changes.saveOpenPost();
		if (saved !== "saved") {
			setState({ status: "stale", items, message: OPEN_POST_MESSAGES[saved] });
			return;
		}
		const result = await publishChanges();
		R.match(
			result,
			() => {
				props.changes.markPublished();
				setOpen(false);
			},
			(error) =>
				setState({
					status: "failed",
					items,
					message: NOTES_ERROR_MESSAGES[error],
				}),
		);
	}

	if (count === 0) return null;
	const pending = state.status === "publishing";

	return (
		<>
			<Button size="sm" onClick={openList}>
				<UploadSimpleIcon data-icon="inline-start" />
				Publish changes
				<Badge variant="secondary">{count}</Badge>
			</Button>
			<ResponsiveDialog
				open={open}
				onOpenChange={(next) => {
					if (!pending) setOpen(next);
				}}
			>
				<ResponsiveDialogContent showCloseButton={false}>
					<ResponsiveDialogHeader>
						<ResponsiveDialogTitle>
							Publish {plural(count)}?
						</ResponsiveDialogTitle>
						<ResponsiveDialogDescription>
							Each site gets these changes, and it rebuilds one time.
						</ResponsiveDialogDescription>
					</ResponsiveDialogHeader>
					{match(state)
						.with({ status: "loading" }, () => (
							<div className="flex flex-col gap-2">
								<Skeleton className="h-9 w-full" />
								<Skeleton className="h-9 w-full" />
							</div>
						))
						.otherwise((loaded) => (
							<ul className="flex max-h-80 flex-col divide-y divide-border overflow-y-auto rounded-lg border border-border">
								{A.map(loaded.items, (item) => (
									<li
										key={item.note.id}
										className="flex items-center gap-3 px-3 py-2 text-sm"
									>
										<span className="min-w-0 flex-1 truncate">
											{item.note.title}
										</span>
										<Badge variant="outline">{item.note.language}</Badge>
										<Badge
											variant={
												item.change === "delete" ? "destructive" : "secondary"
											}
										>
											{CHANGE_LABELS[item.change]}
										</Badge>
									</li>
								))}
							</ul>
						))}
					{state.status === "failed" || state.status === "stale" ? (
						<p role="alert" className="text-sm text-destructive">
							{state.message}
						</p>
					) : null}
					<ResponsiveDialogFooter>
						<ResponsiveDialogClose variant="outline" disabled={pending}>
							Cancel
						</ResponsiveDialogClose>
						<Button
							onClick={publish}
							disabled={state.status === "loading" || pending}
						>
							{pending ? <Spinner data-icon="inline-start" /> : null}
							Publish changes
						</Button>
					</ResponsiveDialogFooter>
				</ResponsiveDialogContent>
			</ResponsiveDialog>
		</>
	);
}
