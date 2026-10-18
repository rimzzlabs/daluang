import {
	ArrowRightIcon,
	KeyIcon,
	ListDashesIcon,
	WebhooksLogoIcon,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";
import { NavLink, type NavLinkKind } from "@/components/shell/nav-link";
import type { AppPagePath } from "@/lib/shell/app-pages";

interface SetupStep {
	href: AppPagePath;
	title: string;
	description: string;
	icon: ComponentType;
}

// The settings that a site needs after the onboarding. Each one is optional for a note.
const SETUP_STEPS: readonly SetupStep[] = [
	{
		href: "/settings/fields",
		title: "Add the fields of your site",
		description: "For example featured or relatedPosts, after the core fields.",
		icon: ListDashesIcon,
	},
	{
		href: "/settings/api-tokens",
		title: "Make an API token",
		description: "Your site reads the published posts with it.",
		icon: KeyIcon,
	},
	{
		href: "/settings/webhooks",
		title: "Add the deploy hook of your site",
		description: "Your site rebuilds when Daluang sends it a POST.",
		icon: WebhooksLogoIcon,
	},
];

export interface SetupStepsProps {
	linkKind: NavLinkKind;
}

/**
 * The settings that a site needs after the onboarding: the fields, a token, and a deploy
 * hook. Each row opens its settings page.
 */
export function SetupSteps(props: SetupStepsProps) {
	return (
		<ul className="flex flex-col gap-2">
			{SETUP_STEPS.map((step) => (
				<li key={step.href}>
					<NavLink
						kind={props.linkKind}
						href={step.href}
						className="group flex items-center gap-3 rounded-2xl border border-border px-4 py-3 transition-colors hover:bg-muted"
					>
						<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
							<step.icon />
						</span>
						<span className="flex min-w-0 flex-1 flex-col">
							<span className="text-sm font-medium">{step.title}</span>
							<span className="text-sm text-muted-foreground">
								{step.description}
							</span>
						</span>
						{/* The arrow tells that the row opens another page. */}
						<ArrowRightIcon className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
					</NavLink>
				</li>
			))}
		</ul>
	);
}
