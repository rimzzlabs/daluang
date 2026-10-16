import { LanguagesSettings } from "@daluang/settings/components/languages-settings";
import { SiteSettings } from "@daluang/settings/components/site-settings";
import type { AppPageProps } from "./page-content";

export function SitePage(props: AppPageProps) {
	return <SiteSettings store={props.settings} />;
}

export function LanguagesPage(props: AppPageProps) {
	return <LanguagesSettings store={props.settings} />;
}
