import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type { ComponentProps } from "react";

export function Empty(props: ComponentProps<"div">) {
	const { className, ...rest } = props;
	return (
		<div
			data-slot="empty"
			className={cn(
				"flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-lg border-dashed p-12 text-center text-balance",
				className,
			)}
			{...rest}
		/>
	);
}

export function EmptyHeader(props: ComponentProps<"div">) {
	const { className, ...rest } = props;
	return (
		<div
			data-slot="empty-header"
			className={cn("flex max-w-sm flex-col items-center gap-2", className)}
			{...rest}
		/>
	);
}

export const emptyMediaVariants = cva(
	"mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default: "bg-transparent",
				icon: "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground [&_svg:not([class*='size-'])]:size-6",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export type EmptyMediaProps = ComponentProps<"div"> &
	VariantProps<typeof emptyMediaVariants>;

export function EmptyMedia(props: EmptyMediaProps) {
	const { className, variant = "default", ...rest } = props;
	return (
		<div
			data-slot="empty-icon"
			data-variant={variant}
			className={cn(emptyMediaVariants({ variant, className }))}
			{...rest}
		/>
	);
}

export function EmptyTitle(props: ComponentProps<"div">) {
	const { className, ...rest } = props;
	return (
		<div
			data-slot="empty-title"
			className={cn("text-lg font-medium tracking-tight", className)}
			{...rest}
		/>
	);
}

export function EmptyDescription(props: ComponentProps<"p">) {
	const { className, ...rest } = props;
	return (
		<p
			data-slot="empty-description"
			className={cn(
				"text-sm/relaxed text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
				className,
			)}
			{...rest}
		/>
	);
}

export function EmptyContent(props: ComponentProps<"div">) {
	const { className, ...rest } = props;
	return (
		<div
			data-slot="empty-content"
			className={cn(
				"flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance",
				className,
			)}
			{...rest}
		/>
	);
}
