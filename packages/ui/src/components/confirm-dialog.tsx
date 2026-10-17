import type { ReactNode } from "react";
import { Button } from "./button";
import {
	ResponsiveDialog,
	ResponsiveDialogClose,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogFooter,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
} from "./responsive-dialog";
import { Spinner } from "./spinner";

export interface ConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: ReactNode;
	/** The label of the button that does the action, for example "Revoke the token". */
	confirmLabel: string;
	/** True for a change that cannot be undone. The button then has the destructive look. */
	destructive?: boolean;
	/** True while the action runs. The buttons are then off. */
	pending: boolean;
	/** The message of a failed action, or `null`. */
	error: string | null;
	onConfirm: () => void;
}

/** The question before an action: what happens, and a button to do it or to cancel. */
export function ConfirmDialog(props: ConfirmDialogProps) {
	return (
		<ResponsiveDialog
			open={props.open}
			onOpenChange={(open) => {
				if (!props.pending) props.onOpenChange(open);
			}}
		>
			<ResponsiveDialogContent showCloseButton={false}>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle>{props.title}</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						{props.description}
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>
				{props.error === null ? null : (
					<p role="alert" className="text-sm text-destructive">
						{props.error}
					</p>
				)}
				<ResponsiveDialogFooter>
					<ResponsiveDialogClose variant="outline" disabled={props.pending}>
						Cancel
					</ResponsiveDialogClose>
					<Button
						type="button"
						variant={props.destructive ? "destructive" : "default"}
						disabled={props.pending}
						onClick={props.onConfirm}
					>
						{props.pending ? <Spinner data-icon="inline-start" /> : null}
						{props.confirmLabel}
					</Button>
				</ResponsiveDialogFooter>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}
