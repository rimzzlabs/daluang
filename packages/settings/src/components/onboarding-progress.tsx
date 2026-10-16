import { A } from "@mobily/ts-belt";
import { cn } from "cn";

export interface OnboardingProgressProps {
	/** The title of each step, in order. */
	steps: readonly string[];
	/** The index of the current step, from 0. */
	current: number;
}

/** The steps of the onboarding: a bar for each step, and the number of the current step. */
export function OnboardingProgress(props: OnboardingProgressProps) {
	const total = A.length(props.steps);
	return (
		<div className="flex flex-col gap-3">
			<p className="text-sm text-muted-foreground">
				Step {props.current + 1} of {total}
			</p>
			<ol aria-label="Steps" className="flex gap-2">
				{A.mapWithIndex(props.steps, (index, title) => (
					<li
						key={title}
						aria-current={index === props.current ? "step" : undefined}
						className="flex-1"
					>
						<span
							className={cn(
								"block h-1 rounded-full bg-muted",
								index <= props.current && "bg-primary",
							)}
						/>
						<span className="sr-only">{title}</span>
					</li>
				))}
			</ol>
		</div>
	);
}
