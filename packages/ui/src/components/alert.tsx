import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type { ComponentProps } from "react";

export const alertVariants = cva(
	"group/alert relative grid w-full gap-0.5 rounded-lg border px-4 py-3 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default: "bg-card text-card-foreground",
				destructive:
					"bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export function Alert(
	props: ComponentProps<"div"> & VariantProps<typeof alertVariants>,
) {
	const { className, variant, ...rest } = props;
	return (
		<div
			data-slot="alert"
			role="alert"
			className={cn(alertVariants({ variant }), className)}
			{...rest}
		/>
	);
}

export function AlertTitle(props: ComponentProps<"div">) {
	const { className, ...rest } = props;
	return (
		<div
			data-slot="alert-title"
			className={cn(
				"font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
				className,
			)}
			{...rest}
		/>
	);
}

export function AlertDescription(props: ComponentProps<"div">) {
	const { className, ...rest } = props;
	return (
		<div
			data-slot="alert-description"
			className={cn(
				"text-sm text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
				className,
			)}
			{...rest}
		/>
	);
}

export function AlertAction(props: ComponentProps<"div">) {
	const { className, ...rest } = props;
	return (
		<div
			data-slot="alert-action"
			className={cn("absolute top-2.5 right-3", className)}
			{...rest}
		/>
	);
}
