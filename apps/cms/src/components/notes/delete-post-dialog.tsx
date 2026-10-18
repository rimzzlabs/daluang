import type { ListedNote } from "@daluang/notes/note-list";
import { ConfirmDialog } from "@daluang/ui/components/confirm-dialog";
import { R } from "@mobily/ts-belt";
import { useState } from "react";
import { deleteNoteOfCms, NOTES_ERROR_MESSAGES } from "@/lib/notes/client";

export interface DeletePostDialogProps {
	/** The post to delete. The dialog keeps it while it closes. */
	post: ListedNote | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDeleted: () => void;
}

type DeleteState =
	| { status: "idle" }
	| { status: "deleting" }
	| { status: "failed"; message: string };

const DRAFT_DESCRIPTION =
	"Daluang deletes the draft at once. You cannot undo a delete.";

const PUBLISHED_DESCRIPTION =
	"Your site keeps the post until you select Publish changes. Then Daluang deletes the post, and your site removes it at its next build.";

/**
 * The confirmation before a delete. A draft goes at once. A published post waits for
 * Publish changes, so its delete can be cancelled.
 */
export function DeletePostDialog(props: DeletePostDialogProps) {
	const [state, setState] = useState<DeleteState>({ status: "idle" });
	const title = props.post?.note.title ?? "the post";
	const published = props.post?.note.status === "published";

	async function deletePost() {
		const { post } = props;
		if (post === null) return;
		setState({ status: "deleting" });
		const result = await deleteNoteOfCms(post.note.id);
		R.match(
			result,
			() => {
				setState({ status: "idle" });
				props.onDeleted();
				props.onOpenChange(false);
			},
			(error) =>
				setState({ status: "failed", message: NOTES_ERROR_MESSAGES[error] }),
		);
	}

	return (
		<ConfirmDialog
			open={props.open}
			onOpenChange={(open) => {
				props.onOpenChange(open);
				if (!open) setState({ status: "idle" });
			}}
			title={`Delete ${title}?`}
			description={published ? PUBLISHED_DESCRIPTION : DRAFT_DESCRIPTION}
			confirmLabel="Delete the post"
			destructive
			pending={state.status === "deleting"}
			error={state.status === "failed" ? state.message : null}
			onConfirm={deletePost}
		/>
	);
}
