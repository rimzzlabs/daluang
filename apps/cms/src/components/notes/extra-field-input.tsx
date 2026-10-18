import type { FieldDefinition } from "@daluang/notes/field-definitions";
import type { FieldInput } from "@daluang/notes/note-form";
import { Checkbox } from "@daluang/ui/components/checkbox";
import { Field, FieldError, FieldLabel } from "@daluang/ui/components/field";
import { Input } from "@daluang/ui/components/input";
import { useId } from "react";
import { FormField } from "./form-field";

export interface ExtraFieldInputProps {
	definition: FieldDefinition;
	value: FieldInput;
	error: string | undefined;
	onChange: (next: FieldInput) => void;
}

/**
 * The input of one extra field of the site: a checkbox for yes or no, and a text box for a
 * text, a number, or a list.
 */
export function ExtraFieldInput(props: ExtraFieldInputProps) {
	const id = useId();
	const { definition } = props;
	const invalid = props.error !== undefined;

	if (definition.type === "boolean")
		return (
			<Field orientation="horizontal" data-invalid={invalid}>
				<Checkbox
					id={id}
					checked={props.value === true}
					aria-invalid={invalid}
					onCheckedChange={(checked) => props.onChange(checked)}
				/>
				<FieldLabel htmlFor={id}>{definition.label}</FieldLabel>
				{invalid ? <FieldError>{props.error}</FieldError> : null}
			</Field>
		);

	return (
		<FormField
			id={id}
			label={definition.label}
			optional={!definition.required}
			help={
				definition.type === "list"
					? "Separate the items with commas."
					: undefined
			}
			error={props.error}
		>
			<Input
				id={id}
				name={`fields.${definition.name}`}
				value={typeof props.value === "string" ? props.value : ""}
				inputMode={definition.type === "number" ? "decimal" : undefined}
				autoComplete="off"
				aria-invalid={invalid}
				aria-describedby={`${id}-help`}
				onChange={(event) => props.onChange(event.target.value)}
			/>
		</FormField>
	);
}
