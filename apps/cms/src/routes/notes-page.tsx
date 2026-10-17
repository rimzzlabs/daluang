import {
	ArrowRightIcon,
	KeyIcon,
	ListDashesIcon,
	WebhooksLogoIcon,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";
import { NavLink } from "@/components/shell/nav-link";
import type { AppPagePath } from "@/lib/app-pages";
import type { AppPageProps } from "./page-content";

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

export function NotesPage(props: AppPageProps) {
	return (
		<section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
			<div className="text-center">
				<h1 className="font-serif text-2xl font-semibold tracking-tight">
					No posts yet
				</h1>
				<p className="mt-2 text-pretty text-muted-foreground">
					The editor comes in the next step. Your posts will show here.
				</p>
			</div>
			<h2 className="mt-10 text-sm font-medium">Set up your site</h2>
			<ul className="mt-3 flex flex-col gap-2">
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
							<ArrowRightIcon className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
						</NavLink>
					</li>
				))}
			</ul>
		</section>
	);
}
