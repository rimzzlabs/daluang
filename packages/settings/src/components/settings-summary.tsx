import { A, pipe } from "@mobily/ts-belt";
import { languageLabel } from "../language-label";
import type { CmsSettings } from "../settings";

export interface SettingsSummaryProps {
	settings: CmsSettings;
}

/** The answers of the onboarding, as a list of terms and values. */
export function SettingsSummary(props: SettingsSummaryProps) {
	const { site, languages } = props.settings;
	const rows = [
		{ term: "Site", value: site.name },
		{ term: "Address", value: site.url ?? "No address" },
		{
			term: "Languages",
			value: pipe(languages.languages, A.map(languageLabel), A.join(", ")),
		},
		{ term: "New notes", value: languageLabel(languages.defaultLanguage) },
	];
	return (
		<dl className="divide-y divide-border rounded-2xl border border-border">
			{A.map(rows, (row) => (
				<div
					key={row.term}
					className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-4"
				>
					<dt className="text-sm text-muted-foreground sm:w-28 sm:shrink-0">
						{row.term}
					</dt>
					<dd className="min-w-0 text-sm font-medium wrap-break-word">
						{row.value}
					</dd>
				</div>
			))}
		</dl>
	);
}
