import { Posts } from "@/components/notes/posts";
import type { AppPageProps } from "./page-content";

export function NotesPage(props: AppPageProps) {
	return <Posts changes={props.changes} linkKind={props.linkKind} />;
}
