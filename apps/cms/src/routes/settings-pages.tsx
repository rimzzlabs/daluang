import { FieldsSettings } from "@/components/settings/fields-settings";
import { LanguagesSettings } from "@/components/settings/languages-settings";
import { SiteSettings } from "@/components/settings/site-settings";
import type { AppPageProps } from "./page-content";

export function SitePage(props: AppPageProps) {
	return <SiteSettings store={props.settings} />;
}

export function LanguagesPage(props: AppPageProps) {
	return <LanguagesSettings store={props.settings} />;
}

export function FieldsPage(props: AppPageProps) {
	return <FieldsSettings store={props.settings} />;
}
