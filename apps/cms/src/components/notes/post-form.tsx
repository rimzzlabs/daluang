import type { FieldDefinition } from "@daluang/notes/field-definitions";
import {
	type NoteForm,
	type NoteFormErrors,
	withSlug,
	withTitle,
} from "@daluang/notes/note-form";
import { languageLabel } from "@daluang/settings/language-label";
import {
	FieldError,
	FieldGroup,
	FieldLegend,
	FieldSet,
} from "@daluang/ui/components/field";
import { Input } from "@daluang/ui/components/input";
import { Skeleton } from "@daluang/ui/components/skeleton";
import { Textarea } from "@daluang/ui/components/textarea";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@daluang/ui/components/toggle-group";
import { A } from "@mobily/ts-belt";
import { lazy, Suspense, useId, useState } from "react";
import { ExtraFieldInput } from "./extra-field-input";
import { FormField } from "./form-field";

// The help of the slug. A typed slug, or the slug of a stored post, no longer follows
// the title.
const SLUG_HELP = {
	follows:
		"The last part of the address of the post. It follows the title until you change it.",
	typed: "The last part of the address of the post.",
};

// CodeMirror and the grammars of Markdown are large. Only the pages of the editor load them.
const MarkdownEditor = lazy(() =>
	import("./markdown-editor").then((module) => ({
		default: module.MarkdownEditor,
	})),
);

// The parser of Comark loads with the first preview.
const PostPreview = lazy(() =>
	import("./post-preview").then((module) => ({ default: module.PostPreview })),
);

type BodyView = "write" | "preview";

function isBodyView(value: unknown): value is BodyView {
	return value === "write" || value === "preview";
}

export interface PostFormProps {
	value: NoteForm;
	errors: NoteFormErrors;
	/** The language tags of the CMS. */
	languages: readonly string[];
	/** The extra fields of the site. */
	definitions: readonly FieldDefinition[];
	onChange: (next: NoteForm) => void;
}

/**
 * The inputs of a post: the title, the slug, the language, the description, the keywords,
 * the extra fields of the site, and the Markdown body.
 */
export function PostForm(props: PostFormProps) {
	const id = useId();
	const { value, errors } = props;
	const [view, setView] = useState<BodyView>("write");

	function change(patch: Partial<NoteForm>) {
		props.onChange({ ...value, ...patch });
	}

	return (
		<FieldGroup className="gap-6">
			<FormField id={`${id}-title`} label="Title" error={errors.title}>
				<Input
					id={`${id}-title`}
					name="title"
					value={value.title}
					autoComplete="off"
					aria-invalid={errors.title !== undefined}
					aria-describedby={`${id}-title-help`}
					onChange={(event) =>
						props.onChange(withTitle(value, event.target.value))
					}
				/>
			</FormField>
			<FormField
				id={`${id}-slug`}
				label="Slug"
				help={SLUG_HELP[value.slugTouched ? "typed" : "follows"]}
				error={errors.slug}
			>
				<Input
					id={`${id}-slug`}
					name="slug"
					value={value.slug}
					className="font-mono"
					autoComplete="off"
					spellCheck={false}
					aria-invalid={errors.slug !== undefined}
					aria-describedby={`${id}-slug-help`}
					onChange={(event) =>
						props.onChange(withSlug(value, event.target.value))
					}
				/>
			</FormField>
			{A.length(props.languages) > 1 ? (
				<FieldSet>
					<FieldLegend variant="label">Language</FieldLegend>
					<ToggleGroup
						variant="outline"
						size="sm"
						aria-label="Language"
						className="flex-wrap"
						value={[value.language]}
						onValueChange={(values) => {
							const [next] = values;
							// A click on the chosen language gives no value. The post keeps it.
							if (typeof next === "string") change({ language: next });
						}}
					>
						{A.map(props.languages, (tag) => (
							<ToggleGroupItem key={tag} value={tag}>
								{languageLabel(tag)}
							</ToggleGroupItem>
						))}
					</ToggleGroup>
					{errors.language === undefined ? null : (
						<FieldError>{errors.language}</FieldError>
					)}
				</FieldSet>
			) : null}
			<FormField
				id={`${id}-description`}
				label="Description"
				optional
				help="Search engines and social cards show it. Keep it at 300 characters or fewer."
				error={errors.description}
			>
				<Textarea
					id={`${id}-description`}
					name="description"
					value={value.description}
					aria-invalid={errors.description !== undefined}
					aria-describedby={`${id}-description-help`}
					onChange={(event) => change({ description: event.target.value })}
				/>
			</FormField>
			<FormField
				id={`${id}-keywords`}
				label="Keywords"
				optional
				help="Separate the keywords with commas."
				error={errors.keywords}
			>
				<Input
					id={`${id}-keywords`}
					name="keywords"
					value={value.keywords}
					autoComplete="off"
					aria-invalid={errors.keywords !== undefined}
					aria-describedby={`${id}-keywords-help`}
					onChange={(event) => change({ keywords: event.target.value })}
				/>
			</FormField>
			{A.map(props.definitions, (definition) => (
				<ExtraFieldInput
					key={definition.name}
					definition={definition}
					value={value.fields[definition.name] ?? ""}
					error={errors[`fields.${definition.name}`]}
					onChange={(input) =>
						change({ fields: { ...value.fields, [definition.name]: input } })
					}
				/>
			))}
			<FormField
				id={`${id}-body`}
				label="Body"
				help="Markdown, with the components of Comark."
				error={errors.body}
			>
				<ToggleGroup
					variant="outline"
					size="sm"
					aria-label="View of the body"
					value={[view]}
					onValueChange={(values) => {
						const [next] = values;
						if (isBodyView(next)) setView(next);
					}}
				>
					<ToggleGroupItem value="write">Write</ToggleGroupItem>
					<ToggleGroupItem value="preview">Preview</ToggleGroupItem>
				</ToggleGroup>
				{/* The editor stays in the page during the preview, so it keeps its undo history. */}
				<div hidden={view === "preview"}>
					<Suspense fallback={<Skeleton className="h-80 w-full rounded-xl" />}>
						<MarkdownEditor
							id={`${id}-body`}
							label="Body"
							defaultValue={value.body}
							invalid={errors.body !== undefined}
							describedBy={`${id}-body-help`}
							onChange={(body) => change({ body })}
						/>
					</Suspense>
				</div>
				{view === "preview" ? (
					<Suspense fallback={<Skeleton className="h-80 w-full rounded-xl" />}>
						<PostPreview body={value.body} />
					</Suspense>
				) : null}
			</FormField>
		</FieldGroup>
	);
}
