import { SpinnerIcon } from "@phosphor-icons/react";
import { cn } from "cn";
import type { ComponentProps } from "react";

export type SpinnerProps = ComponentProps<typeof SpinnerIcon>;

export function Spinner(props: SpinnerProps) {
	const { className, ...rest } = props;
	return (
		<SpinnerIcon
			data-slot="spinner"
			role="status"
			aria-label="Loading"
			className={cn("size-4 animate-spin", className)}
			{...rest}
		/>
	);
}
