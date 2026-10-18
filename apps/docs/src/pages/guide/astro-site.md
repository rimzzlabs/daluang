# Astro site [Read the published posts in an Astro site at each build]

An Astro site reads the published posts of the CMS at its build, through the content API.
Each post comes with its Markdown and its Comark document. The site renders the document
with its own components, so the site decides how each component looks.

The page to write and publish a post comes in a later release. The content API is ready
now.

## What the content API gives

`GET /api/content/notes` gives each published post, the last published first. A draft is
not in the list. Each post has:

- its metadata: `title`, `slug`, `language`, `description`, `keywords`, `publishedAt`,
  and `updatedAt`
- `fields`: the extra fields of your site, for example `featured`
- `body`: the Markdown, as the writer typed it
- `document`: the Comark document of the Markdown

A node of the document is a text, or `[tag, props, ...children]`. A component of Comark,
for example `::callout{type="tip"}`, is a node with its own tag:

```json
["callout", { "type": "tip" }, "Run ", ["strong", {}, "pnpm i"], " first."]
```

A comment is `[null, {}, text]`. A code block is a `pre` node with `language` and `meta`:
the rest of the first line of the fence, for example `title="app.ts" showLineNumbers`.
The CMS does not highlight code, so your site highlights it with its own Shiki.

## Give the site a token

1. Make an API token for the site. See [API tokens](/guide/api-tokens).
2. Give the build of the site two secrets: `DALUANG_URL`, the URL of your CMS, and
   `DALUANG_TOKEN`, the token.

## Add the loader

Copy this file into your site as `src/lib/daluang-loader.ts`:

```ts
import type { Loader } from "astro/loaders";

interface DaluangLoaderOptions {
  /** The URL of the CMS, for example `https://cms.example.com`. */
  url: string;
  /** An API token of the CMS: `dlg_…`. */
  token: string;
}

interface ContentNote extends Record<string, unknown> {
  slug: string;
  language: string;
  body: string;
}

/** Reads the published posts of a Daluang CMS at each build of the site. */
export function daluangLoader(options: DaluangLoaderOptions): Loader {
  return {
    name: "daluang",
    load: async (context) => {
      const response = await fetch(new URL("/api/content/notes", options.url), {
        headers: { Authorization: `Bearer ${options.token}` },
      });
      if (!response.ok)
        throw new Error(
          `Daluang answered ${response.status}. Check the URL and the token.`,
        );
      const { notes }: { notes: ContentNote[] } = await response.json();
      context.store.clear();
      for (const note of notes) {
        const id = `${note.language}/${note.slug}`;
        const data = await context.parseData({ id, data: note });
        context.store.set({
          id,
          data,
          body: note.body,
          digest: context.generateDigest(note),
        });
      }
    },
  };
}
```

The ID of a post is `<language>/<slug>`, for example `en/jotai-recipes`. Two posts with
the same slug in different languages are translations of each other. If the URL or the
token is wrong, the build stops with the status of the answer.

## Define the collection

Add the collection to `src/content.config.ts`. Add each extra field of your site to the
schema of `fields`:

```ts
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { daluangLoader } from "./lib/daluang-loader";

const posts = defineCollection({
  loader: daluangLoader({
    url: process.env.DALUANG_URL ?? "",
    token: process.env.DALUANG_TOKEN ?? "",
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    language: z.string(),
    description: z.string(),
    keywords: z.array(z.string()),
    publishedAt: z.string(),
    updatedAt: z.string(),
    fields: z.object({ featured: z.boolean() }),
    document: z.object({ nodes: z.array(z.any()) }),
  }),
});

export const collections = { posts };
```

## Render the document

Make one component that renders a node, and that calls itself for the children. Give each
tag of a component its own branch. A tag with no branch renders as the HTML element of
the same name.

```astro
---
// src/components/post-node.astro
import Callout from "./callout.astro";
import CodeBlock from "./code-block.astro";

const { node } = Astro.props;
const [Tag, props, ...children] = Array.isArray(node) ? node : [];
const known = ["callout", "pre"];
---

{typeof node === "string" && node}
{
  Tag === "callout" && (
    <Callout {...props}>
      {children.map((child) => <Astro.self node={child} />)}
    </Callout>
  )
}
{
  Tag === "pre" && (
    <CodeBlock
      code={children[0]?.[2] ?? ""}
      language={props.language}
      meta={props.meta}
    />
  )
}
{
  typeof Tag === "string" && !known.includes(Tag) && (
    <Tag {...props}>{children.map((child) => <Astro.self node={child} />)}</Tag>
  )
}
```

- A comment has the tag `null`, so no branch renders it.
- Map `pre` to your own code block. The first child of `pre` is the `code` node, and its
  text is the code. With no branch, `language` and `meta` go on the `<pre>` element as
  attributes.
- An island needs a branch of its own, with its import in the same file. Astro must see
  the import to hydrate it: `{Tag === "demo" && <Demo client:visible {...props} />}`.

The code block can use the `Code` component of Astro, which highlights with Shiki. Your
own transformer can read `meta`:

```astro
---
// src/components/code-block.astro
import { Code } from "astro:components";

const { code, language = "plaintext", meta } = Astro.props;
---

<figure data-meta={meta}>
  <Code code={code} lang={language} />
</figure>
```

Then render the nodes on the page of a post:

```astro
---
// src/pages/posts/[...id].astro
import { getCollection } from "astro:content";
import PostNode from "../../components/post-node.astro";

export async function getStaticPaths() {
  const posts = await getCollection("posts");
  return posts.map((post) => ({ params: { id: post.id }, props: { post } }));
}

const { post } = Astro.props;
---

<article>
  <h1>{post.data.title}</h1>
  {post.data.document.nodes.map((node) => <PostNode node={node} />)}
</article>
```

## Rebuild the site at Publish changes

The content API gives the published copy of each post. An edit, a publish, an unpublish,
or a delete waits until the writer selects **Publish changes**. Then the CMS sends one
`publish` event for all the changes.

Add the deploy hook of the site as a webhook, so that the site rebuilds at each Publish
changes. See [Webhooks](/guide/webhooks).
