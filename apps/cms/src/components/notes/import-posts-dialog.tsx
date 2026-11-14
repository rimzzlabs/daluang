import type { FieldDefinition } from "@daluang/notes/field-definitions";
import type { LanguagesSetting } from "@daluang/notes/languages-setting";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
} from "@daluang/ui/components/responsive-dialog";
import { type RefObject, useState } from "react";
import { useImportRun } from "@/hooks/notes/use-import-run";
import { ImportForm } from "./import-posts-form";

export interface ImportPostsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	languages: LanguagesSetting;
	fields: readonly FieldDefinition[];
	/** Reads the posts again after each run. */
	onImported: () => Promise<void>;
	/** The element that gets the focus after a close: the Import button of the page. */
	returnFocus?: RefObject<HTMLElement | null>;
}

/**
 * The dialog that imports Markdown or MDX files as drafts, one file at a time. While a run
 * goes on, the dialog does not close. The run lives above the dialog and the drawer, so a
 * change of the width keeps it. The page gives a new `key` at each open, so each open
 * starts with no files.
 */
export function ImportPostsDialog(props: ImportPostsDialogProps) {
	const importRun = useImportRun(props.onImported);
	const [language, setLanguage] = useState(props.languages.defaultLanguage);
	const running = importRun.run.status === "running";
	return (
		<ResponsiveDialog
			open={props.open}
			onOpenChange={(open) => {
				if (!running) props.onOpenChange(open);
			}}
		>
			<ResponsiveDialogContent
				showCloseButton={false}
				finalFocus={props.returnFocus}
			>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle>Import posts</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						Daluang sends the files one at a time, in the order of their names.
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>
				<ImportForm
					languages={props.languages}
					fields={props.fields}
					language={language}
					onLanguageChange={setLanguage}
					importRun={importRun}
				/>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}
