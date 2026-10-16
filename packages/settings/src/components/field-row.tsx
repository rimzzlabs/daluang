import {
	FIELD_LABEL_MAX_LENGTH,
	FIELD_TYPES,
	type FieldType,
} from "@daluang/notes/field-definitions";
import { Button } from "@daluang/ui/components/button";
import { Checkbox } from "@daluang/ui/components/checkbox";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@daluang/ui/components/field";
import { Input } from "@daluang/ui/components/input";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@daluang/ui/components/toggle-group";
import { A } from "@mobily/ts-belt";
import { TrashIcon } from "@phosphor-icons/react";
import { useEffect, useId, useRef } from "react";
import {
	type FieldDraft,
	type FieldRowErrors,
	relabelField,
	renameField,
} from "../field-drafts";

const TYPE_LABELS: Record<FieldType, string> = {
	text: "Text",
	number: "Number",
	boolean: "Yes or no",
	list: "List of text",
};

function isFieldType(value: unknown): value is FieldType {
	return A.some(FIELD_TYPES, (type) => type === value);
}

export interface FieldRowProps {
	draft: FieldDraft;
	errors: FieldRowErrors;
	/** True for a new row. Its label takes the focus. */
	focus: boolean;
	onChange: (next: FieldDraft) => void;
	onRemove: () => void;
}

/** One extra field: its label, its frontmatter name, its type, and if a note needs it. */
export function FieldRow(props: FieldRowProps) {
	const id = useId();
	const label = useRef<HTMLInputElement>(null);
	const { draft, errors } = props;
	// Focus is a state of the browser. The writer types the label of a new row at once.
	useEffect(() => {
		if (props.focus) label.current?.focus();
	}, [props.focus]);
	const title = draft.label.trim() === "" ? "the new field" : draft.label;
	return (
		<li className="flex flex-col gap-5 rounded-2xl border border-border p-4">
			<div className="grid gap-4 sm:grid-cols-2">
				<Field data-invalid={errors.label !== undefined}>
					<FieldLabel htmlFor={`${id}-label`}>Label</FieldLabel>
					<Input
						ref={label}
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
					<FieldLabel htmlFor={`${id}-name`}>
						Name in the frontmatter
					</FieldLabel>
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
			</div>
			<ToggleGroup
				variant="outline"
				size="sm"
				aria-label={`Type of ${title}`}
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
			<div className="flex items-center justify-between gap-4">
				<Field orientation="horizontal" className="w-auto">
					<Checkbox
						id={`${id}-required`}
						checked={draft.required}
						onCheckedChange={(required) =>
							props.onChange({ ...draft, required })
						}
					/>
					<FieldLabel htmlFor={`${id}-required`}>Required</FieldLabel>
				</Field>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					aria-label={`Remove ${title}`}
					onClick={props.onRemove}
				>
					<TrashIcon data-icon="inline-start" />
					Remove
				</Button>
			</div>
			<FieldDescription className="sr-only">
				The editor shows this field on each note.
			</FieldDescription>
		</li>
	);
}
