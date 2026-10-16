import { D } from "@mobily/ts-belt";
import { SidebarSimpleIcon } from "@phosphor-icons/react";
import { cn } from "cn";
import {
	type ComponentProps,
	type CSSProperties,
	createContext,
	type KeyboardEvent,
	type PointerEvent,
	useContext,
	useEffect,
	useEffectEvent,
	useRef,
	useState,
} from "react";
import { useIsMobile } from "../hooks/use-mobile";
import {
	clampSidebarWidth,
	SIDEBAR_STATE_KEY,
	SIDEBAR_WIDTH_KEY,
	SIDEBAR_WIDTH_REM,
	writeSidebarPreference,
} from "../lib/sidebar-preferences";
import { Button } from "./button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "./sheet";

const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON_REM = 3;
const KEYBOARD_SHORTCUT = "b";
const KEYBOARD_STEP_REM = 1;
// A drag this far below the minimum width collapses the sidebar to its icons.
const COLLAPSE_BELOW_REM = SIDEBAR_WIDTH_REM.min - 4;
// A pointer that moves less than this is a click, not a drag.
const DRAG_THRESHOLD_PX = 3;

interface SidebarContextValue {
	state: "expanded" | "collapsed";
	open: boolean;
	setOpen: (open: boolean) => void;
	openMobile: boolean;
	setOpenMobile: (open: boolean) => void;
	isMobile: boolean;
	toggleSidebar: () => void;
	/** The width of the expanded sidebar, in rem. */
	width: number;
	/** Sets the width, in rem, between the minimum and the maximum. `commit` saves it. */
	setWidth: (width: number, commit: boolean) => void;
	resizing: boolean;
	setResizing: (resizing: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
	const context = useContext(SidebarContext);
	if (!context)
		throw new Error("useSidebar must be used within a SidebarProvider.");
	return context;
}

export interface SidebarProviderProps extends ComponentProps<"div"> {
	/** The stored open state. `readSidebarPreferences` reads it in the browser. */
	defaultOpen?: boolean;
	/** The stored width, in rem. */
	defaultWidth?: number;
}

export function SidebarProvider(props: SidebarProviderProps) {
	const {
		defaultOpen = true,
		defaultWidth = SIDEBAR_WIDTH_REM.default,
		...rest
	} = props;
	const isMobile = useIsMobile();
	const [open, setOpenState] = useState(defaultOpen);
	const [openMobile, setOpenMobile] = useState(false);
	const [width, setWidthState] = useState(() =>
		clampSidebarWidth(defaultWidth),
	);
	const [resizing, setResizing] = useState(false);

	function setOpen(value: boolean) {
		setOpenState(value);
		writeSidebarPreference({
			key: SIDEBAR_STATE_KEY,
			value: value ? "expanded" : "collapsed",
		});
	}

	function setWidth(value: number, commit: boolean) {
		const next = clampSidebarWidth(value);
		setWidthState(next);
		if (commit)
			writeSidebarPreference({ key: SIDEBAR_WIDTH_KEY, value: String(next) });
	}

	function toggleSidebar() {
		if (isMobile) return setOpenMobile(!openMobile);
		setOpen(!open);
	}

	const onKeyDown = useEffectEvent((event: globalThis.KeyboardEvent) => {
		if (event.defaultPrevented) return;
		if (event.key !== KEYBOARD_SHORTCUT || !(event.metaKey || event.ctrlKey))
			return;
		event.preventDefault();
		toggleSidebar();
	});

	useEffect(() => {
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	const style: CSSProperties &
		Record<"--sidebar-width" | "--sidebar-width-icon", string> = {
		"--sidebar-width": `${width}rem`,
		"--sidebar-width-icon": `${SIDEBAR_WIDTH_ICON_REM}rem`,
		...rest.style,
	};

	return (
		<SidebarContext
			value={{
				state: open ? "expanded" : "collapsed",
				open,
				setOpen,
				openMobile,
				setOpenMobile,
				isMobile,
				toggleSidebar,
				width,
				setWidth,
				resizing,
				setResizing,
			}}
		>
			<div
				data-slot="sidebar-wrapper"
				data-resizing={resizing}
				{...rest}
				style={style}
				className={cn(
					"group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar data-[resizing=true]:cursor-col-resize data-[resizing=true]:select-none",
					rest.className,
				)}
			/>
		</SidebarContext>
	);
}

export type SidebarProps = ComponentProps<"div"> & {
	side?: "left" | "right";
	variant?: "sidebar" | "floating" | "inset";
	collapsible?: "offcanvas" | "icon" | "none";
};

export function Sidebar(props: SidebarProps) {
	const sidebar = useSidebar();
	const side = props.side ?? "left";
	const variant = props.variant ?? "sidebar";
	const collapsible = props.collapsible ?? "offcanvas";
	const rest = D.deleteKeys(props, [
		"side",
		"variant",
		"collapsible",
		"className",
		"children",
	]);
	const spaced = variant === "floating" || variant === "inset";

	if (collapsible === "none") {
		return (
			<div
				data-slot="sidebar"
				className={cn(
					"flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
					props.className,
				)}
				{...rest}
			>
				{props.children}
			</div>
		);
	}

	if (sidebar.isMobile) {
		const mobileStyle: CSSProperties & Record<"--sidebar-width", string> = {
			"--sidebar-width": SIDEBAR_WIDTH_MOBILE,
		};
		return (
			<Sheet open={sidebar.openMobile} onOpenChange={sidebar.setOpenMobile}>
				<SheetContent
					dir={props.dir}
					data-sidebar="sidebar"
					data-slot="sidebar"
					data-mobile="true"
					className="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
					style={mobileStyle}
					side={side}
				>
					<SheetHeader className="sr-only">
						<SheetTitle>Sidebar</SheetTitle>
						<SheetDescription>The navigation of the app.</SheetDescription>
					</SheetHeader>
					<div className="flex h-full w-full flex-col">{props.children}</div>
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<div
			className="group peer hidden text-sidebar-foreground md:block"
			data-state={sidebar.state}
			data-collapsible={sidebar.state === "collapsed" ? collapsible : ""}
			data-variant={variant}
			data-side={side}
			data-slot="sidebar"
		>
			{/* The gap keeps the space of the fixed sidebar in the layout of the page. */}
			<div
				data-slot="sidebar-gap"
				className={cn(
					"relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear group-data-[resizing=true]/sidebar-wrapper:transition-none",
					"group-data-[collapsible=offcanvas]:w-0",
					"group-data-[side=right]:rotate-180",
					spaced
						? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
						: "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
				)}
			/>
			<div
				data-slot="sidebar-container"
				data-side={side}
				className={cn(
					"fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear group-data-[resizing=true]/sidebar-wrapper:transition-none data-[side=left]:left-0 data-[side=left]:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] data-[side=right]:right-0 data-[side=right]:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)] md:flex",
					spaced
						? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
						: "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
					props.className,
				)}
				{...rest}
			>
				<div
					data-sidebar="sidebar"
					data-slot="sidebar-inner"
					className="flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-sm group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-sidebar-border"
				>
					{props.children}
				</div>
			</div>
		</div>
	);
}

export type SidebarTriggerProps = ComponentProps<typeof Button>;

export function SidebarTrigger(props: SidebarTriggerProps) {
	const { className, onClick, ...rest } = props;
	const sidebar = useSidebar();

	return (
		<Button
			data-sidebar="trigger"
			data-slot="sidebar-trigger"
			variant="ghost"
			size="icon-sm"
			className={cn(className)}
			aria-expanded={sidebar.isMobile ? sidebar.openMobile : sidebar.open}
			onClick={(event) => {
				onClick?.(event);
				sidebar.toggleSidebar();
			}}
			{...rest}
		>
			<SidebarSimpleIcon />
			<span className="sr-only">Toggle the sidebar</span>
		</Button>
	);
}

interface Drag {
	startX: number;
	startWidth: number;
	/** 1 when the sidebar is on the left, -1 on the right. */
	direction: number;
	remInPx: number;
	moved: boolean;
	width: number;
}

/**
 * The edge of the sidebar. Drag it to change the width, or click it to collapse and expand
 * the sidebar. It follows the window splitter pattern of WAI-ARIA: arrow keys change the
 * width, Home and End go to the limits, and Enter or Space collapses and expands.
 */
export function SidebarRail(props: ComponentProps<"div">) {
	const { className, ...rest } = props;
	const sidebar = useSidebar();
	const drag = useRef<Drag | null>(null);
	// The click that ends a drag must not also collapse the sidebar.
	const dragged = useRef(false);

	function onPointerDown(event: PointerEvent<HTMLDivElement>) {
		if (event.button !== 0) return;
		event.currentTarget.setPointerCapture(event.pointerId);
		const side = event.currentTarget
			.closest("[data-side]")
			?.getAttribute("data-side");
		const startWidth = sidebar.open ? sidebar.width : SIDEBAR_WIDTH_ICON_REM;
		drag.current = {
			startX: event.clientX,
			startWidth,
			direction: side === "right" ? -1 : 1,
			remInPx:
				Number.parseFloat(
					getComputedStyle(document.documentElement).fontSize,
				) || 16,
			moved: false,
			width: startWidth,
		};
	}

	function onPointerMove(event: PointerEvent<HTMLDivElement>) {
		const current = drag.current;
		if (current === null) return;
		const deltaPx = (event.clientX - current.startX) * current.direction;
		if (!current.moved && Math.abs(deltaPx) < DRAG_THRESHOLD_PX) return;
		if (!current.moved) sidebar.setResizing(true);
		current.moved = true;
		const next = current.startWidth + deltaPx / current.remInPx;

		if (sidebar.open && next < COLLAPSE_BELOW_REM)
			return sidebar.setOpen(false);
		if (!sidebar.open && next < SIDEBAR_WIDTH_REM.min) return;
		if (!sidebar.open) sidebar.setOpen(true);
		current.width = clampSidebarWidth(next);
		sidebar.setWidth(next, false);
	}

	function onPointerUp(event: PointerEvent<HTMLDivElement>) {
		const current = drag.current;
		drag.current = null;
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
		if (current === null || !current.moved) return;
		dragged.current = true;
		sidebar.setResizing(false);
		if (sidebar.open) sidebar.setWidth(current.width, true);
	}

	function onClick() {
		if (dragged.current) {
			dragged.current = false;
			return;
		}
		sidebar.toggleSidebar();
	}

	function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		const widths: Record<string, number> = {
			ArrowLeft: sidebar.width - KEYBOARD_STEP_REM,
			ArrowRight: sidebar.width + KEYBOARD_STEP_REM,
			Home: SIDEBAR_WIDTH_REM.min,
			End: SIDEBAR_WIDTH_REM.max,
		};
		const width = widths[event.key];
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			return sidebar.toggleSidebar();
		}
		if (width === undefined) return;
		event.preventDefault();
		if (!sidebar.open) sidebar.setOpen(true);
		sidebar.setWidth(width, true);
	}

	return (
		// biome-ignore lint/a11y/useSemanticElements: a window splitter has no native element. An <hr> cannot take focus or a pointer drag.
		<div
			data-sidebar="rail"
			data-slot="sidebar-rail"
			role="separator"
			tabIndex={0}
			aria-orientation="vertical"
			aria-label="Resize the sidebar"
			aria-valuemin={SIDEBAR_WIDTH_REM.min}
			aria-valuemax={SIDEBAR_WIDTH_REM.max}
			aria-valuenow={sidebar.open ? sidebar.width : SIDEBAR_WIDTH_ICON_REM}
			aria-valuetext={sidebar.open ? `${sidebar.width} rem` : "Collapsed"}
			title="Drag to resize. Click to collapse or expand."
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onPointerCancel={onPointerUp}
			onClick={onClick}
			onKeyDown={onKeyDown}
			className={cn(
				"absolute inset-y-0 z-20 hidden w-4 cursor-col-resize touch-none outline-hidden transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:start-1/2 after:w-0.5 hover:after:bg-sidebar-border focus-visible:after:bg-sidebar-ring group-data-[resizing=true]/sidebar-wrapper:after:bg-sidebar-ring sm:flex ltr:-translate-x-1/2 rtl:-translate-x-1/2",
				"group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar",
				"[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
				"[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
				className,
			)}
			{...rest}
		/>
	);
}

export function SidebarInset(props: ComponentProps<"main">) {
	const { className, ...rest } = props;
	return (
		<main
			data-slot="sidebar-inset"
			className={cn(
				"relative flex w-full min-w-0 flex-1 flex-col bg-background md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
				className,
			)}
			{...rest}
		/>
	);
}
