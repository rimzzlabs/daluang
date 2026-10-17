import { Button } from "@daluang/ui/components/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@daluang/ui/components/field";
import { Input } from "@daluang/ui/components/input";
import { RadioGroup, RadioGroupItem } from "@daluang/ui/components/radio-group";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@daluang/ui/components/toggle-group";
import { A, R } from "@mobily/ts-belt";
import { CheckIcon, PlusIcon } from "@phosphor-icons/react";
import { type SyntheticEvent, useId, useState } from "react";
import { languageLabel } from "../language-label";
import {
	addLanguage,
	chooseLanguages,
	type LanguagesChoice,
	languageOptions,
} from "../languages-choice";
import { COMMON_LANGUAGES } from "../suggested-languages";

export interface LanguagesFieldProps {
	value: LanguagesChoice;
	onChange: (next: LanguagesChoice) => void;
}

type AddState = { status: "idle" } | { status: "not-a-language"; tag: string };

/**
 * The languages that a writer chooses, and the language of a new note. The writer selects
 * a common language, or types the tag of another one. One language stays on the list.
 */
export function LanguagesField(props: LanguagesFieldProps) {
	const id = useId();
	const [tag, setTag] = useState("");
	const [add, setAdd] = useState<AddState>({ status: "idle" });
	// A typed language stays a choice after the writer unselects it.
	const [typed, setTyped] = useState<readonly string[]>([]);
	const options = languageOptions({
		common: COMMON_LANGUAGES,
		chosen: [...props.value.languages, ...typed],
	});
	const many = A.length(props.value.languages) > 1;

	function addTypedLanguage(event: SyntheticEvent) {
		event.preventDefault();
		const result = addLanguage(props.value, tag);
		if (R.isError(result)) {
			setAdd({ status: "not-a-language", tag });
			return;
		}
		const next = R.getExn(result);
		props.onChange(next);
		setTyped(A.uniq([...typed, ...next.languages]));
		setTag("");
		setAdd({ status: "idle" });
	}

	return (
		<div className="flex flex-col gap-6">
			<FieldSet>
				<FieldLegend variant="label">Languages</FieldLegend>
				<FieldDescription>
					Select each language that you write in.
				</FieldDescription>
				<ToggleGroup
					multiple
					variant="outline"
					size="sm"
					aria-label="Languages"
					className="w-full flex-wrap"
					value={props.value.languages}
					onValueChange={(languages) =>
						props.onChange(chooseLanguages(props.value, languages))
					}
				>
					{A.map(options, (option) => (
						<ToggleGroupItem key={option} value={option}>
							{A.includes(props.value.languages, option) ? (
								<CheckIcon data-icon="inline-start" weight="bold" />
							) : (
								<PlusIcon data-icon="inline-start" />
							)}
							{languageLabel(option)}
							<span className="font-mono text-xs opacity-70">{option}</span>
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			</FieldSet>

			<Field data-invalid={add.status === "not-a-language"}>
				<FieldLabel htmlFor={`${id}-tag`}>Another language</FieldLabel>
				<div className="flex gap-2">
					<Input
						id={`${id}-tag`}
						value={tag}
						placeholder="pt-BR"
						autoComplete="off"
						spellCheck={false}
						aria-invalid={add.status === "not-a-language"}
						aria-describedby={`${id}-tag-help`}
						onChange={(event) => setTag(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter") addTypedLanguage(event);
						}}
					/>
					<Button
						type="button"
						variant="outline"
						disabled={tag.trim() === ""}
						onClick={addTypedLanguage}
					>
						<PlusIcon data-icon="inline-start" />
						Add
					</Button>
				</div>
				{add.status === "not-a-language" ? (
					<FieldError id={`${id}-tag-help`}>
						"{add.tag}" is not a language tag. Use a tag such as pt-BR or
						zh-Hant.
					</FieldError>
				) : (
					<FieldDescription id={`${id}-tag-help`}>
						Type the tag of a language that is not on the list, for example
						pt-BR or zh-Hant.
					</FieldDescription>
				)}
			</Field>

			<FieldSet>
				<FieldLegend variant="label">New notes start in</FieldLegend>
				{many ? (
					<RadioGroup
						value={props.value.defaultLanguage}
						onValueChange={(language) =>
							props.onChange({ ...props.value, defaultLanguage: language })
						}
					>
						{A.map(props.value.languages, (language) => (
							<Field key={language} orientation="horizontal">
								<RadioGroupItem value={language} id={`${id}-${language}`} />
								<FieldLabel htmlFor={`${id}-${language}`}>
									{languageLabel(language)}
								</FieldLabel>
							</Field>
						))}
					</RadioGroup>
				) : (
					<FieldDescription>
						{languageLabel(props.value.defaultLanguage)}. Select one more
						language to choose another one.
					</FieldDescription>
				)}
			</FieldSet>
		</div>
	);
}
