import { Dashboard } from "@/components/dashboard/dashboard";
import type { AppPageProps } from "./page-content";

export function DashboardPage(props: AppPageProps) {
	return <Dashboard settings={props.settings} linkKind={props.linkKind} />;
}
