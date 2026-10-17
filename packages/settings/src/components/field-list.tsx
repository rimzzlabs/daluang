import type { FieldDefinition } from "@daluang/notes/field-definitions";
import { Badge } from "@daluang/ui/components/badge";
import { Button } from "@daluang/ui/components/button";
import { A } from "@mobily/ts-belt";
import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { TYPE_LABELS } from "./field-form";

export interface FieldListProps {
	fields: readonly FieldDefinition[];
	onEdit: (index: number) => void;
	onRemove: (index: number) => void;
}

/** The extra fields of the site: the label, the name, the type, and the actions. */
export function FieldList(props: FieldListProps) {
	return (
		<ul
			aria-label="Extra fields"
			className="divide-y divide-border rounded-2xl border border-border"
		>
			{A.mapWithIndex(props.fields, (index, field) => (
				<li
					key={field.name}
					className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center"
				>
					<div className="flex min-w-0 flex-1 flex-col gap-1">
						<p className="truncate text-sm font-medium">{field.label}</p>
						<div className="flex flex-wrap items-center gap-1.5">
							<code className="font-mono text-xs text-muted-foreground">
								{field.name}
							</code>
							<Badge variant="secondary">{TYPE_LABELS[field.type]}</Badge>
							{field.required ? (
								<Badge variant="outline">Required</Badge>
							) : null}
						</div>
					</div>
					<div className="flex items-center gap-1">
						<Button
							type="button"
							size="sm"
							variant="ghost"
							aria-label={`Change ${field.label}`}
							onClick={() => props.onEdit(index)}
						>
							<PencilSimpleIcon data-icon="inline-start" />
							Change
						</Button>
						<Button
							type="button"
							size="sm"
							variant="ghost"
							aria-label={`Remove ${field.label}`}
							onClick={() => props.onRemove(index)}
						>
							<TrashIcon data-icon="inline-start" />
							Remove
						</Button>
					</div>
				</li>
			))}
		</ul>
	);
}
