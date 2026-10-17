# First sign-in [Answer the questions of the CMS before the first post]

At the first sign-in, the CMS asks three questions. Then you can write.

## The questions

1. **Your site.** Type the name of the site that shows your posts. The address of the site
   is optional. The sidebar shows the name.
2. **Your languages.** Select each language that you write in. To add a language that is
   not on the list, type its tag, for example `pt-BR`. Then select the language of a new
   post.
3. **Ready.** Check your answers. Select **Start writing** to save them.

The CMS selects the languages of your browser first. One language must stay on the list.

## Where the CMS keeps the answers

The CMS keeps the answers in the table `setting` of its D1 database, one row for each
setting. Each page of the CMS reads the settings. If a setting is missing, the page opens
the questions again.

## A language tag

A post has one language, as a BCP 47 tag: `en`, `id`, or `pt-BR`. Two posts with the same
slug and two languages are translations of each other.

## Add the fields of your site

Each post has the core fields: `title`, `slug`, `language`, `description`, `keywords`,
`status`, `publishedAt`, and `updatedAt`. If your site reads more fields, add them:

1. Open **Settings → Fields** in the sidebar.
2. Select **Add a field**, or a common field such as `featured`.
3. Type the label. The CMS makes the frontmatter name from it, for example
   `relatedPosts` for "Related posts". You can change the name.
4. Select the type: text, number, yes or no, or a list of text.
5. Select **Required** if each post must have a value.
6. Select **Save**.

The questions of the first sign-in do not ask for the fields. A site with no extra fields
needs no change.

## Change an answer

Open **Settings → Site** or **Settings → Languages** in the sidebar. Change the answer,
then select **Save**. The sidebar shows a new site name at once.

To see the questions again, delete the rows of the table `setting`. Then open the CMS:

```sh
pnpm --filter @daluang/cms exec wrangler d1 execute DB --local --command 'delete from "setting"'
```

For the database of your Cloudflare account, use `--remote` in place of `--local`.
