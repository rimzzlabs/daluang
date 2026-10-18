import { cn } from "cn";
import type { ComponentProps } from "react";

export type TextareaProps = ComponentProps<"textarea">;

/** A text box of more than one line. It grows with its text, from a height of 4 rem. */
export function Textarea(props: TextareaProps) {
	const { className, ...rest } = props;
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				"flex field-sizing-content min-h-16 w-full resize-none rounded-xl border border-input bg-input/30 px-3 py-3 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
				className,
			)}
			{...rest}
		/>
	);
}
