import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { D } from "@mobily/ts-belt";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { type ComponentProps, type CSSProperties, useState } from "react";
import { useSidebar } from "./sidebar";
import { Skeleton } from "./skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export function SidebarMenu(props: ComponentProps<"ul">) {
	const { className, ...rest } = props;
	return (
		<ul
			data-slot="sidebar-menu"
			data-sidebar="menu"
			className={cn("flex w-full min-w-0 flex-col gap-1", className)}
			{...rest}
		/>
	);
}

export function SidebarMenuItem(props: ComponentProps<"li">) {
	const { className, ...rest } = props;
	return (
		<li
			data-slot="sidebar-menu-item"
			data-sidebar="menu-item"
			className={cn("group/menu-item relative", className)}
			{...rest}
		/>
	);
}

export const sidebarMenuButtonVariants = cva(
	"peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-lg px-3 py-2 text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&>span:last-child]:truncate",
	{
		variants: {
			variant: {
				default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
				outline:
					"bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]",
			},
			size: {
				default: "h-9 text-sm",
				sm: "h-8 text-xs",
				lg: "h-14 px-3 text-sm group-data-[collapsible=icon]:p-0!",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export type SidebarMenuButtonProps = useRender.ComponentProps<"button"> &
	ComponentProps<"button"> & {
		isActive?: boolean;
		tooltip?: string | ComponentProps<typeof TooltipContent>;
	} & VariantProps<typeof sidebarMenuButtonVariants>;

export function SidebarMenuButton(props: SidebarMenuButtonProps) {
	const sidebar = useSidebar();
	const size = props.size ?? "default";
	const element = useRender({
		defaultTagName: "button",
		props: mergeProps<"button">(
			{
				className: cn(
					sidebarMenuButtonVariants({
						variant: props.variant ?? "default",
						size,
					}),
					props.className,
				),
			},
			D.deleteKeys(props, [
				"render",
				"isActive",
				"variant",
				"size",
				"tooltip",
				"className",
			]),
		),
		render: props.tooltip ? (
			<TooltipTrigger render={props.render} />
		) : (
			props.render
		),
		state: {
			slot: "sidebar-menu-button",
			sidebar: "menu-button",
			size,
			active: props.isActive ?? false,
		},
	});

	if (!props.tooltip) return element;
	const tooltip =
		typeof props.tooltip === "string"
			? { children: props.tooltip }
			: props.tooltip;

	return (
		<Tooltip>
			{element}
			<TooltipContent
				side="right"
				align="center"
				hidden={sidebar.state !== "collapsed" || sidebar.isMobile}
				{...tooltip}
			/>
		</Tooltip>
	);
}

export function SidebarMenuAction(
	props: useRender.ComponentProps<"button"> &
		ComponentProps<"button"> & {
			showOnHover?: boolean;
		},
) {
	const { className, render, showOnHover = false, ...rest } = props;
	return useRender({
		defaultTagName: "button",
		props: mergeProps<"button">(
			{
				className: cn(
					"absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=default]/menu-button:top-2 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
					showOnHover &&
						"group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 peer-data-active/menu-button:text-sidebar-accent-foreground aria-expanded:opacity-100 md:opacity-0",
					className,
				),
			},
			rest,
		),
		render,
		state: {
			slot: "sidebar-menu-action",
			sidebar: "menu-action",
		},
	});
}

export function SidebarMenuBadge(props: ComponentProps<"div">) {
	const { className, ...rest } = props;
	return (
		<div
			data-slot="sidebar-menu-badge"
			data-sidebar="menu-badge"
			className={cn(
				"pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium text-sidebar-foreground tabular-nums select-none group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 peer-data-active/menu-button:text-sidebar-accent-foreground",
				className,
			)}
			{...rest}
		/>
	);
}

export function SidebarMenuSkeleton(
	props: ComponentProps<"div"> & {
		showIcon?: boolean;
	},
) {
	const { className, showIcon = false, ...rest } = props;
	// Random width between 50 to 90%.
	// A random width between 50 and 90 %, so a list of skeletons does not look like a grid.
	const [width] = useState(() => `${Math.floor(Math.random() * 40) + 50}%`);
	const style: CSSProperties & Record<"--skeleton-width", string> = {
		"--skeleton-width": width,
	};

	return (
		<div
			data-slot="sidebar-menu-skeleton"
			data-sidebar="menu-skeleton"
			className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
			{...rest}
		>
			{showIcon && (
				<Skeleton
					className="size-4 rounded-md"
					data-sidebar="menu-skeleton-icon"
				/>
			)}
			<Skeleton
				className="h-4 max-w-(--skeleton-width) flex-1"
				data-sidebar="menu-skeleton-text"
				style={style}
			/>
		</div>
	);
}

export function SidebarMenuSub(props: ComponentProps<"ul">) {
	const { className, ...rest } = props;
	return (
		<ul
			data-slot="sidebar-menu-sub"
			data-sidebar="menu-sub"
			className={cn(
				"mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5 group-data-[collapsible=icon]:hidden",
				className,
			)}
			{...rest}
		/>
	);
}

export function SidebarMenuSubItem(props: ComponentProps<"li">) {
	const { className, ...rest } = props;
	return (
		<li
			data-slot="sidebar-menu-sub-item"
			data-sidebar="menu-sub-item"
			className={cn("group/menu-sub-item relative", className)}
			{...rest}
		/>
	);
}

export function SidebarMenuSubButton(
	props: useRender.ComponentProps<"a"> &
		ComponentProps<"a"> & {
			size?: "sm" | "md";
			isActive?: boolean;
		},
) {
	const size = props.size ?? "md";
	return useRender({
		defaultTagName: "a",
		props: mergeProps<"a">(
			{
				className: cn(
					"flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-sm data-[size=sm]:text-xs data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
					props.className,
				),
			},
			D.deleteKeys(props, ["render", "size", "isActive", "className"]),
		),
		render: props.render,
		state: {
			slot: "sidebar-menu-sub-button",
			sidebar: "menu-sub-button",
			size,
			active: props.isActive ?? false,
		},
	});
}
