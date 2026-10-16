import { A, pipe } from "@mobily/ts-belt";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type { ComponentProps, ReactNode } from "react";
import { Label } from "./label";
import { Separator } from "./separator";

export function FieldSet(props: ComponentProps<"fieldset">) {
	const { className, ...rest } = props;
	return (
		<fieldset
			data-slot="field-set"
			className={cn(
				"flex flex-col gap-6 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
				className,
			)}
			{...rest}
		/>
	);
}

export interface FieldLegendProps extends ComponentProps<"legend"> {
	variant?: "legend" | "label";
}

export function FieldLegend(props: FieldLegendProps) {
	const { className, variant = "legend", ...rest } = props;
	return (
		<legend
			data-slot="field-legend"
			data-variant={variant}
			className={cn(
				"mb-3 font-medium data-[variant=label]:text-sm data-[variant=legend]:text-base",
				className,
			)}
			{...rest}
		/>
	);
}

export function FieldGroup(props: ComponentProps<"div">) {
	const { className, ...rest } = props;
	return (
		<div
			data-slot="field-group"
			className={cn(
				"group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4",
				className,
			)}
			{...rest}
		/>
	);
}

export const fieldVariants = cva(
	"group/field flex w-full gap-3 data-[invalid=true]:text-destructive",
	{
		variants: {
			orientation: {
				vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
				horizontal:
					"flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
				responsive:
					"flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
			},
		},
		defaultVariants: {
			orientation: "vertical",
		},
	},
);

export type FieldProps = ComponentProps<"div"> &
	VariantProps<typeof fieldVariants>;

export function Field(props: FieldProps) {
	const { className, orientation = "vertical", ...rest } = props;
	return (
		// biome-ignore lint/a11y/useSemanticElements: a field is one label and its control. `FieldSet` is the fieldset of a group of fields.
		<div
			role="group"
			data-slot="field"
			data-orientation={orientation}
			className={cn(fieldVariants({ orientation }), className)}
			{...rest}
		/>
	);
}

export function FieldContent(props: ComponentProps<"div">) {
	const { className, ...rest } = props;
	return (
		<div
			data-slot="field-content"
			className={cn(
				"group/field-content flex flex-1 flex-col gap-1 leading-snug",
				className,
			)}
			{...rest}
		/>
	);
}

export function FieldLabel(props: ComponentProps<typeof Label>) {
	const { className, ...rest } = props;
	return (
		<Label
			data-slot="field-label"
			className={cn(
				"group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5 has-[>[data-slot=field]]:rounded-xl has-[>[data-slot=field]]:border has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-input/40 has-[>[data-slot=field]]:has-[:focus-visible]:border-ring has-[>[data-slot=field]]:has-[:focus-visible]:ring-[3px] has-[>[data-slot=field]]:has-[:focus-visible]:ring-ring/50 *:data-[slot=field]:p-4 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10",
				"has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
				className,
			)}
			{...rest}
		/>
	);
}

export function FieldTitle(props: ComponentProps<"div">) {
	const { className, ...rest } = props;
	return (
		<div
			data-slot="field-label"
			className={cn(
				"flex w-fit items-center gap-2 text-sm font-medium group-data-[disabled=true]/field:opacity-50",
				className,
			)}
			{...rest}
		/>
	);
}

export function FieldDescription(props: ComponentProps<"p">) {
	const { className, ...rest } = props;
	return (
		<p
			data-slot="field-description"
			className={cn(
				"text-left text-sm leading-normal font-normal text-muted-foreground group-has-data-horizontal/field:text-balance [[data-variant=legend]+&]:-mt-1.5",
				"last:mt-0 nth-last-2:-mt-1",
				"[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
				className,
			)}
			{...rest}
		/>
	);
}

export function FieldSeparator(props: ComponentProps<"div">) {
	const { children, className, ...rest } = props;
	return (
		<div
			data-slot="field-separator"
			data-content={children !== undefined && children !== null}
			className={cn(
				"relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2",
				className,
			)}
			{...rest}
		>
			<Separator className="absolute inset-0 top-1/2" />
			{children === undefined || children === null ? null : (
				<span
					className="relative mx-auto block w-fit bg-background px-2 text-muted-foreground"
					data-slot="field-separator-content"
				>
					{children}
				</span>
			)}
		</div>
	);
}

export interface FieldErrorProps extends ComponentProps<"div"> {
	/** The messages to show. The field shows each message one time. */
	errors?: readonly string[];
}

function errorContent(props: FieldErrorProps): ReactNode {
	if (props.children !== undefined && props.children !== null)
		return props.children;
	const messages = pipe(
		props.errors ?? [],
		A.uniq,
		A.filter((message) => message !== ""),
	);
	if (A.length(messages) === 0) return null;
	if (A.length(messages) === 1) return messages[0];
	return (
		<ul className="ml-4 flex list-disc flex-col gap-1">
			{A.map(messages, (message) => (
				<li key={message}>{message}</li>
			))}
		</ul>
	);
}

export function FieldError(props: FieldErrorProps) {
	const { className, errors: _errors, ...rest } = props;
	const content = errorContent(props);
	if (content === null) return null;
	return (
		<div
			role="alert"
			data-slot="field-error"
			className={cn("text-sm font-normal text-destructive", className)}
			{...rest}
		>
			{content}
		</div>
	);
}
