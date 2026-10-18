import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@daluang/ui/components/field";
import type { ReactNode } from "react";

export interface FormFieldProps {
	/** The ID of the control. The help text gets `<id>-help`. */
	id: string;
	label: string;
	/** True adds "(optional)" to the label. */
	optional?: boolean;
	help?: string;
	error: string | undefined;
	/** The control, with `aria-describedby` set to `<id>-help`. */
	children: ReactNode;
}

/** The error of a control, or its help text. */
function FieldHelp(props: Pick<FormFieldProps, "id" | "help" | "error">) {
	const id = `${props.id}-help`;
	if (props.error !== undefined)
		return <FieldError id={id}>{props.error}</FieldError>;
	if (props.help === undefined) return null;
	return <FieldDescription id={id}>{props.help}</FieldDescription>;
}

/** A label, a control, and the help text or the error of the control. */
export function FormField(props: FormFieldProps) {
	return (
		<Field data-invalid={props.error !== undefined}>
			<FieldLabel htmlFor={props.id}>
				{props.label}
				{props.optional ? (
					<>
						{" "}
						<span className="font-normal text-muted-foreground">
							(optional)
						</span>
					</>
				) : null}
			</FieldLabel>
			{props.children}
			<FieldHelp id={props.id} help={props.help} error={props.error} />
		</Field>
	);
}
