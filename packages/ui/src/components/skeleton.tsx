import { cn } from "cn";
import type { ComponentProps } from "react";

export type SkeletonProps = ComponentProps<"div">;

export function Skeleton(props: SkeletonProps) {
	const { className, ...rest } = props;
	return (
		<div
			data-slot="skeleton"
			className={cn("animate-pulse rounded-xl bg-muted", className)}
			{...rest}
		/>
	);
}
