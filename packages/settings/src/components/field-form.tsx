import {
	FIELD_LABEL_MAX_LENGTH,
	FIELD_TYPES,
	type FieldType,
} from "@daluang/notes/field-definitions";
import { Checkbox } from "@daluang/ui/components/checkbox";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@daluang/ui/components/field";
import { Input } from "@daluang/ui/components/input";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@daluang/ui/components/toggle-group";
import { A } from "@mobily/ts-belt";
import { useId } from "react";
import {
	type FieldDraft,
	type FieldRowErrors,
	relabelField,
	renameField,
} from "../field-drafts";

/** The name of each type of value, as the writer reads it. */
export const TYPE_LABELS: Record<FieldType, string> = {
	text: "Text",
	number: "Number",
	boolean: "Yes or no",
	list: "List of text",
};

function isFieldType(value: unknown): value is FieldType {
	return A.some(FIELD_TYPES, (type) => type === value);
}

export interface FieldFormProps {
	draft: FieldDraft;
	errors: FieldRowErrors;
	onChange: (next: FieldDraft) => void;
}

/** The inputs of one extra field: its label, its frontmatter name, its type, and Required. */
export function FieldForm(props: FieldFormProps) {
	const id = useId();
	const { draft, errors } = props;
	return (
		<FieldGroup className="gap-5">
			<Field data-invalid={errors.label !== undefined}>
				<FieldLabel htmlFor={`${id}-label`}>Label</FieldLabel>
				<Input
					id={`${id}-label`}
					value={draft.label}
					placeholder="Related posts"
					maxLength={FIELD_LABEL_MAX_LENGTH}
					autoComplete="off"
					aria-invalid={errors.label !== undefined}
					onChange={(event) =>
						props.onChange(relabelField(draft, event.target.value))
					}
				/>
				{errors.label === undefined ? null : (
					<FieldError>{errors.label}</FieldError>
				)}
			</Field>
			<Field data-invalid={errors.name !== undefined}>
				<FieldLabel htmlFor={`${id}-name`}>Name in the frontmatter</FieldLabel>
				<Input
					id={`${id}-name`}
					value={draft.name}
					placeholder="relatedPosts"
					className="font-mono"
					autoComplete="off"
					spellCheck={false}
					aria-invalid={errors.name !== undefined}
					onChange={(event) =>
						props.onChange(renameField(draft, event.target.value))
					}
				/>
				{errors.name === undefined ? null : (
					<FieldError>{errors.name}</FieldError>
				)}
			</Field>
			<FieldSet className="gap-3">
				<FieldLegend variant="label" className="mb-0">
					Type
				</FieldLegend>
				<ToggleGroup
					variant="outline"
					size="sm"
					aria-label="Type"
					className="flex-wrap"
					value={[draft.type]}
					onValueChange={(values) => {
						const [type] = values;
						if (isFieldType(type)) props.onChange({ ...draft, type });
					}}
				>
					{A.map(FIELD_TYPES, (type) => (
						<ToggleGroupItem key={type} value={type}>
							{TYPE_LABELS[type]}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			</FieldSet>
			<Field orientation="horizontal">
				<Checkbox
					id={`${id}-required`}
					checked={draft.required}
					onCheckedChange={(required) => props.onChange({ ...draft, required })}
				/>
				<FieldLabel htmlFor={`${id}-required`}>
					Required: each post must have a value
				</FieldLabel>
			</Field>
		</FieldGroup>
	);
}
