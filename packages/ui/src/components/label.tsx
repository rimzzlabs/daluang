import { cn } from "cn";
import type { ComponentProps } from "react";

export type LabelProps = ComponentProps<"label">;

export function Label(props: LabelProps) {
	const { className, ...rest } = props;
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: the caller gives `htmlFor` or a control.
		<label
			data-slot="label"
			className={cn(
				"flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
				className,
			)}
			{...rest}
		/>
	);
}
