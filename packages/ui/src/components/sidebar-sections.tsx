import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "cn";
import type { ComponentProps } from "react";
import { Input } from "./input";
import { Separator } from "./separator";

export function SidebarInput(props: ComponentProps<typeof Input>) {
	const { className, ...rest } = props;
	return (
		<Input
			data-slot="sidebar-input"
			data-sidebar="input"
			className={cn("h-8 w-full bg-background shadow-none", className)}
			{...rest}
		/>
	);
}

export function SidebarHeader(props: ComponentProps<"div">) {
	const { className, ...rest } = props;
	return (
		<div
			data-slot="sidebar-header"
			data-sidebar="header"
			className={cn(
				"flex flex-col gap-2 p-2 [--radius:var(--radius-xl)]",
				className,
			)}
			{...rest}
		/>
	);
}

export function SidebarFooter(props: ComponentProps<"div">) {
	const { className, ...rest } = props;
	return (
		<div
			data-slot="sidebar-footer"
			data-sidebar="footer"
			className={cn("flex flex-col gap-2 p-2", className)}
			{...rest}
		/>
	);
}

export function SidebarSeparator(props: ComponentProps<typeof Separator>) {
	const { className, ...rest } = props;
	return (
		<Separator
			data-slot="sidebar-separator"
			data-sidebar="separator"
			className={cn("mx-2 w-auto bg-sidebar-border", className)}
			{...rest}
		/>
	);
}

export function SidebarContent(props: ComponentProps<"div">) {
	const { className, ...rest } = props;
	return (
		<div
			data-slot="sidebar-content"
			data-sidebar="content"
			className={cn(
				"no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-auto [--radius:var(--radius-xl)] group-data-[collapsible=icon]:overflow-hidden",
				className,
			)}
			{...rest}
		/>
	);
}

export function SidebarGroup(props: ComponentProps<"div">) {
	const { className, ...rest } = props;
	return (
		<div
			data-slot="sidebar-group"
			data-sidebar="group"
			className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
			{...rest}
		/>
	);
}

export function SidebarGroupLabel(
	props: useRender.ComponentProps<"div"> & ComponentProps<"div">,
) {
	const { className, render, ...rest } = props;
	return useRender({
		defaultTagName: "div",
		props: mergeProps<"div">(
			{
				className: cn(
					"flex h-8 shrink-0 items-center rounded-md px-3 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
					className,
				),
			},
			rest,
		),
		render,
		state: {
			slot: "sidebar-group-label",
			sidebar: "group-label",
		},
	});
}

export function SidebarGroupAction(
	props: useRender.ComponentProps<"button"> & ComponentProps<"button">,
) {
	const { className, render, ...rest } = props;
	return useRender({
		defaultTagName: "button",
		props: mergeProps<"button">(
			{
				className: cn(
					"absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
					className,
				),
			},
			rest,
		),
		render,
		state: {
			slot: "sidebar-group-action",
			sidebar: "group-action",
		},
	});
}

export function SidebarGroupContent(props: ComponentProps<"div">) {
	const { className, ...rest } = props;
	return (
		<div
			data-slot="sidebar-group-content"
			data-sidebar="group-content"
			className={cn("w-full text-sm", className)}
			{...rest}
		/>
	);
}
