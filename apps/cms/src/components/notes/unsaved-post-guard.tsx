import { ConfirmDialog } from "@daluang/ui/components/confirm-dialog";
import { useBlocker } from "@tanstack/react-router";
import type { SaveState } from "./post-status-bar";

export interface UnsavedPostGuardProps {
	save: SaveState;
	/** True while the server does not have the last form. */
	hasUnsaved: () => boolean;
	/** True when the current form is not valid, so the browser refuses its save. */
	isInvalid: () => boolean;
}

/**
 * True when the writer must confirm before a router link leaves the post. After a refused
 * or a failed save, the last send at the unmount will very probably not save the form
 * either. A form that is not valid now is refused for certain. A valid form that only
 * waits for its save is sent at the unmount, as usual.
 */
export function mustConfirmLeave(props: UnsavedPostGuardProps): boolean {
	if (!props.hasUnsaved()) return false;
	const status = props.save.status;
	return status === "invalid" || status === "failed" || props.isInvalid();
}

/**
 * Asks before a router link leaves a post with text that Daluang could not save. It needs
 * the router, so it renders only in the app island. The close of the browser tab has the
 * warning of `useAutosave`.
 */
export function UnsavedPostGuard(props: UnsavedPostGuardProps) {
	const blocker = useBlocker({
		shouldBlockFn: () => mustConfirmLeave(props),
		enableBeforeUnload: false,
		withResolver: true,
	});
	return (
		<ConfirmDialog
			open={blocker.status === "blocked"}
			onOpenChange={(open) => {
				if (!open && blocker.status === "blocked") blocker.reset();
			}}
			title="Leave the post?"
			description="This post has text that Daluang could not save. If you leave the page, you can lose the text."
			confirmLabel="Leave the page"
			destructive
			pending={false}
			error={null}
			onConfirm={() => {
				if (blocker.status === "blocked") blocker.proceed();
			}}
		/>
	);
}
