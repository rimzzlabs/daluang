import { MarkdownDocument } from "@comark/react";
import { Skeleton } from "@daluang/ui/components/skeleton";
import { pipe, S } from "@mobily/ts-belt";
import { type MarkdownDocument as ComarkDocument, parseMarkdown } from "comark";
import { useEffect, useState } from "react";

export interface PostPreviewProps {
	/** The Markdown body of the post. */
	body: string;
}

interface ParsedBody {
	body: string;
	document: ComarkDocument;
}

const FRAME = "min-h-80 rounded-xl border border-border";

/**
 * The body of a post as Comark renders it. The CMS shows each component of Comark with the
 * tag of the component. Each site maps the tag to its own component.
 */
export function PostPreview(props: PostPreviewProps) {
	const { body } = props;
	const [parsed, setParsed] = useState<ParsedBody | null>(null);

	// The parser of Comark works asynchronously, so the preview waits for its document.
	useEffect(() => {
		let current = true;
		parseMarkdown(body).then((document) => {
			if (current) setParsed({ body, document });
		});
		return () => {
			current = false;
		};
	}, [body]);

	if (pipe(body, S.trim, S.isEmpty))
		return (
			<p
				className={`${FRAME} flex items-center justify-center text-sm text-muted-foreground`}
			>
				Write the body first. The preview shows it here.
			</p>
		);
	if (parsed === null || parsed.body !== body)
		return <Skeleton className={`${FRAME} w-full`} />;
	return (
		<MarkdownDocument
			value={parsed.document}
			className={`post-preview ${FRAME} p-4`}
		/>
	);
}
