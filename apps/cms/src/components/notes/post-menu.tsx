import {
	type ListedNote,
	type NoteAction,
	noteActions,
} from "@daluang/notes/note-list";
import { Button } from "@daluang/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@daluang/ui/components/dropdown-menu";
import { A } from "@mobily/ts-belt";
import {
	ArrowCounterClockwiseIcon,
	DotsThreeIcon,
	EyeSlashIcon,
	type Icon,
	TrashIcon,
	UploadSimpleIcon,
} from "@phosphor-icons/react";

const ACTION_LABELS: Record<NoteAction, string> = {
	publish: "Publish",
	unpublish: "Unpublish",
	cancel: "Cancel the change",
	delete: "Delete",
};

const ACTION_ICONS: Record<NoteAction, Icon> = {
	publish: UploadSimpleIcon,
	unpublish: EyeSlashIcon,
	cancel: ArrowCounterClockwiseIcon,
	delete: TrashIcon,
};

export interface PostMenuProps {
	post: ListedNote;
	onAction: (action: NoteAction) => void;
}

/**
 * The menu of a post in the list. A publish or an unpublish waits for Publish changes, and
 * a cancel stops the change that waits. A delete asks for a confirmation first.
 */
export function PostMenu(props: PostMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						size="icon-sm"
						className="max-sm:size-11"
						aria-label={`Actions of ${props.post.note.title}`}
					/>
				}
			>
				<DotsThreeIcon />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{A.map(noteActions(props.post), (action) => {
					const ActionIcon = ACTION_ICONS[action];
					return (
						<DropdownMenuItem
							key={action}
							variant={action === "delete" ? "destructive" : "default"}
							onClick={() => props.onAction(action)}
						>
							<ActionIcon />
							{ACTION_LABELS[action]}
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
