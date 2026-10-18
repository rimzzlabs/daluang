import { languageLabel } from "@daluang/settings/language-label";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@daluang/ui/components/toggle-group";
import { A } from "@mobily/ts-belt";

// The value of "All". It is not a language tag, so no language of the CMS can take it.
const ALL = "*";

export interface LanguageFilterProps {
	/** The language tags of the CMS. */
	languages: readonly string[];
	/** The chosen language, or `null` for each language. */
	value: string | null;
	onChange: (language: string | null) => void;
}

/** The choice of the language of the posts list: All, or one language of the CMS. */
export function LanguageFilter(props: LanguageFilterProps) {
	return (
		<ToggleGroup
			variant="outline"
			size="sm"
			aria-label="Language"
			className="flex-wrap"
			value={[props.value ?? ALL]}
			onValueChange={(values) => {
				const [next] = values;
				// A click on the chosen item clears the choice, so it shows each language.
				props.onChange(typeof next === "string" && next !== ALL ? next : null);
			}}
		>
			<ToggleGroupItem value={ALL}>All</ToggleGroupItem>
			{A.map(props.languages, (tag) => (
				<ToggleGroupItem key={tag} value={tag}>
					{languageLabel(tag)}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}
