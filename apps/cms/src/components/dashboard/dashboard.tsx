import { siteHost } from "@daluang/settings/site";
import { buttonVariants } from "@daluang/ui/components/button";
import {
	Page,
	PageActions,
	PageDescription,
	PageHeader,
	PageHeading,
	PageTitle,
} from "@daluang/ui/components/page";
import { PlusIcon } from "@phosphor-icons/react";
import { NavLink, type NavLinkKind } from "@/components/shell/nav-link";
import { useSettings } from "@/hooks/settings/use-settings";
import type { SettingsStore } from "@/lib/settings/settings-store";
import { SetupSteps } from "./setup-steps";

export interface DashboardProps {
	settings: SettingsStore;
	linkKind: NavLinkKind;
}

/** The first page after the sign-in: the site, a new post, and the steps to set up the site. */
export function Dashboard(props: DashboardProps) {
	const { site } = useSettings(props.settings);
	return (
		<Page>
			<PageHeader>
				<PageHeading>
					<PageTitle className="text-2xl">{site.name}</PageTitle>
					<PageDescription>
						{site.url === null ? (
							"Your site has no address yet. Add it in Settings, then Site."
						) : (
							<a
								href={site.url}
								target="_blank"
								rel="noreferrer"
								className="underline-offset-2 hover:text-foreground hover:underline"
							>
								{siteHost(site.url)}
							</a>
						)}
					</PageDescription>
				</PageHeading>
				<PageActions>
					<NavLink
						kind={props.linkKind}
						href="/posts/new"
						className={buttonVariants()}
					>
						<PlusIcon data-icon="inline-start" />
						New post
					</NavLink>
				</PageActions>
			</PageHeader>
			<section
				aria-labelledby="setup-title"
				className="flex max-w-2xl flex-col gap-3"
			>
				<h2 id="setup-title" className="text-sm font-medium">
					Set up your site
				</h2>
				<SetupSteps linkKind={props.linkKind} />
			</section>
		</Page>
	);
}
