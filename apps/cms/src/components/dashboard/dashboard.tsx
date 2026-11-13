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
import { usePostList } from "@/hooks/notes/use-post-list";
import { useSettings } from "@/hooks/settings/use-settings";
import type { ChangesStore } from "@/lib/notes/changes-store";
import type { SettingsStore } from "@/lib/settings/settings-store";
import { RecentPosts } from "./recent-posts";
import { SetupSteps } from "./setup-steps";

export interface DashboardProps {
	settings: SettingsStore;
	changes: ChangesStore;
	linkKind: NavLinkKind;
}

/**
 * The first page after the sign-in: the site, the recent posts, and the steps to set up
 * the site.
 */
export function Dashboard(props: DashboardProps) {
	const { site } = useSettings(props.settings);
	const { list, retry } = usePostList(props.changes);
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
			<div className="grid gap-8 lg:grid-cols-3">
				<section
					aria-labelledby="recent-title"
					className="flex min-w-0 flex-col gap-3 lg:col-span-2"
				>
					<div className="flex items-baseline justify-between gap-3">
						<h2 id="recent-title" className="text-sm font-medium">
							Recent posts
						</h2>
						<NavLink
							kind={props.linkKind}
							href="/posts"
							className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
						>
							All posts
						</NavLink>
					</div>
					<RecentPosts list={list} linkKind={props.linkKind} onRetry={retry} />
				</section>
				<div className="flex min-w-0 flex-col gap-8">
					<section
						aria-labelledby="setup-title"
						className="flex flex-col gap-3"
					>
						<h2 id="setup-title" className="text-sm font-medium">
							Set up your site
						</h2>
						<SetupSteps linkKind={props.linkKind} />
					</section>
				</div>
			</div>
		</Page>
	);
}
