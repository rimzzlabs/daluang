import { cn } from "cn";
import type { ComponentProps } from "react";

/**
 * The frame of a page in the app shell. The content starts at the left edge of the shell
 * and stops at 72rem, so a list stays readable on a wide screen. An empty state centers
 * itself inside it.
 */
export function Page(props: ComponentProps<"section">) {
	const { className, ...rest } = props;
	return (
		<section
			data-slot="page"
			className={cn(
				"flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8",
				className,
			)}
			{...rest}
		/>
	);
}

/**
 * The title and the description of a page on the left, and its primary action on the
 * right. On a phone the action goes below the title.
 */
export function PageHeader(props: ComponentProps<"header">) {
	const { className, ...rest } = props;
	return (
		<header
			data-slot="page-header"
			className={cn(
				"flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
				className,
			)}
			{...rest}
		/>
	);
}

export function PageHeading(props: ComponentProps<"div">) {
	const { className, ...rest } = props;
	return (
		<div
			data-slot="page-heading"
			className={cn("flex min-w-0 flex-col gap-1", className)}
			{...rest}
		/>
	);
}

export function PageTitle(props: ComponentProps<"h1">) {
	const { className, ...rest } = props;
	return (
		<h1
			data-slot="page-title"
			className={cn(
				"font-serif text-xl font-semibold tracking-tight",
				className,
			)}
			{...rest}
		/>
	);
}

export function PageDescription(props: ComponentProps<"p">) {
	const { className, ...rest } = props;
	return (
		<p
			data-slot="page-description"
			className={cn(
				"max-w-prose text-sm text-pretty text-muted-foreground",
				className,
			)}
			{...rest}
		/>
	);
}

/** The actions of a page. On a phone each one is full width and 44px high, for a thumb. */
export function PageActions(props: ComponentProps<"div">) {
	const { className, ...rest } = props;
	return (
		<div
			data-slot="page-actions"
			className={cn(
				"flex shrink-0 flex-wrap items-center gap-2 max-sm:*:h-11 max-sm:*:flex-1",
				className,
			)}
			{...rest}
		/>
	);
}
