import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@daluang/ui/components/field";
import { Input } from "@daluang/ui/components/input";
import { useId } from "react";
import { SITE_NAME_MAX_LENGTH } from "../site";
import type { SiteDraft, SiteErrors } from "../site-draft";

export interface SiteFieldsProps {
	value: SiteDraft;
	errors: SiteErrors;
	onChange: (next: SiteDraft) => void;
}

/** The name and the address of the site that shows the notes. */
export function SiteFields(props: SiteFieldsProps) {
	const id = useId();
	const { value, errors } = props;
	return (
		<FieldGroup className="gap-5">
			<Field data-invalid={errors.name !== undefined}>
				<FieldLabel htmlFor={`${id}-name`}>Site name</FieldLabel>
				<Input
					id={`${id}-name`}
					name="name"
					value={value.name}
					placeholder="My site"
					maxLength={SITE_NAME_MAX_LENGTH}
					autoComplete="off"
					aria-invalid={errors.name !== undefined}
					aria-describedby={`${id}-name-help`}
					onChange={(event) =>
						props.onChange({ ...value, name: event.target.value })
					}
				/>
				{errors.name === undefined ? (
					<FieldDescription id={`${id}-name-help`}>
						Daluang shows this name in the sidebar.
					</FieldDescription>
				) : (
					<FieldError id={`${id}-name-help`}>{errors.name}</FieldError>
				)}
			</Field>
			<Field data-invalid={errors.url !== undefined}>
				<FieldLabel htmlFor={`${id}-url`}>
					Site address{" "}
					<span className="font-normal text-muted-foreground">(optional)</span>
				</FieldLabel>
				<Input
					id={`${id}-url`}
					name="url"
					type="url"
					inputMode="url"
					value={value.url}
					placeholder="https://example.com"
					autoComplete="url"
					spellCheck={false}
					aria-invalid={errors.url !== undefined}
					aria-describedby={`${id}-url-help`}
					onChange={(event) =>
						props.onChange({ ...value, url: event.target.value })
					}
				/>
				{errors.url === undefined ? (
					<FieldDescription id={`${id}-url-help`}>
						The address where readers find your posts.
					</FieldDescription>
				) : (
					<FieldError id={`${id}-url-help`}>{errors.url}</FieldError>
				)}
			</Field>
		</FieldGroup>
	);
}

export interface SiteErrorFocus {
	form: HTMLFormElement;
	errors: SiteErrors;
}

/** Moves the focus to the first field with an error, so the writer can correct it at once. */
export function focusSiteError(focus: SiteErrorFocus) {
	const name = focus.errors.name === undefined ? "url" : "name";
	const field = focus.form.elements.namedItem(name);
	if (field instanceof HTMLInputElement) field.focus();
}
