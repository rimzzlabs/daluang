import { cn } from "cn";
import {
	type ComponentProps,
	createContext,
	type ReactNode,
	useContext,
} from "react";
import { useIsDesktop } from "../hooks/use-desktop";
import { Button } from "./button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./dialog";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "./drawer";

// True when the parts render as a dialog. The root reads the width one time for its parts.
const DesktopContext = createContext(false);

export interface ResponsiveDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: ReactNode;
}

/**
 * A dialog on a desktop, and a drawer from the bottom on a phone or a tablet. Put each
 * action of a page in one: a form, or the confirmation of a change that cannot be undone.
 */
export function ResponsiveDialog(props: ResponsiveDialogProps) {
	const desktop = useIsDesktop();
	if (desktop)
		return (
			<DesktopContext.Provider value={true}>
				<Dialog open={props.open} onOpenChange={props.onOpenChange}>
					{props.children}
				</Dialog>
			</DesktopContext.Provider>
		);
	return (
		<DesktopContext.Provider value={false}>
			<Drawer
				showSwipeHandle
				open={props.open}
				onOpenChange={props.onOpenChange}
			>
				{props.children}
			</Drawer>
		</DesktopContext.Provider>
	);
}

export interface ResponsiveDialogContentProps {
	className?: string;
	children?: ReactNode;
	showCloseButton?: boolean;
}

export function ResponsiveDialogContent(props: ResponsiveDialogContentProps) {
	const desktop = useContext(DesktopContext);
	if (desktop)
		return (
			<DialogContent
				className={props.className}
				showCloseButton={props.showCloseButton}
			>
				{props.children}
			</DialogContent>
		);
	return (
		<DrawerContent>
			<div
				className={cn(
					"flex flex-col gap-6 overflow-y-auto px-4 pb-6",
					props.className,
				)}
			>
				{props.children}
			</div>
		</DrawerContent>
	);
}

export function ResponsiveDialogHeader(props: ComponentProps<"div">) {
	const desktop = useContext(DesktopContext);
	if (desktop) return <DialogHeader {...props} />;
	const { className, ...rest } = props;
	return <DrawerHeader className={cn("px-0", className)} {...rest} />;
}

export function ResponsiveDialogTitle(props: ComponentProps<"h2">) {
	const desktop = useContext(DesktopContext);
	if (desktop) return <DialogTitle {...props} />;
	return <DrawerTitle {...props} />;
}

export function ResponsiveDialogDescription(props: ComponentProps<"p">) {
	const desktop = useContext(DesktopContext);
	if (desktop) return <DialogDescription {...props} />;
	return <DrawerDescription {...props} />;
}

export function ResponsiveDialogFooter(props: ComponentProps<"div">) {
	const desktop = useContext(DesktopContext);
	if (desktop) return <DialogFooter {...props} />;
	const { className, ...rest } = props;
	// A drawer is for a phone or a tablet: each button is 44px high, for a thumb.
	return (
		<DrawerFooter className={cn("px-0 pb-0 *:h-11", className)} {...rest} />
	);
}

/** A button that closes the dialog or the drawer. */
export function ResponsiveDialogClose(props: ComponentProps<typeof Button>) {
	const desktop = useContext(DesktopContext);
	if (desktop) return <DialogClose render={<Button {...props} />} />;
	return <DrawerClose render={<Button {...props} />} />;
}
