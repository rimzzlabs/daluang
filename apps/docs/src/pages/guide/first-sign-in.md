# First sign-in [Answer the questions of the CMS before the first note]

At the first sign-in, the CMS asks three questions. Then you can write.

## The questions

1. **Your site.** Type the name of the site that shows your notes. The address of the site
   is optional. The sidebar shows the name.
2. **Your languages.** Select each language that you write in. To add a language that is
   not on the list, type its tag, for example `pt-BR`. Then select the language of a new
   note.
3. **Ready.** Check your answers. Select **Start writing** to save them.

The CMS selects the languages of your browser first. One language must stay on the list.

## Where the CMS keeps the answers

The CMS keeps the answers in the table `setting` of its D1 database, one row for each
setting. Each page of the CMS reads the settings. If a setting is missing, the page opens
the questions again.

## A language tag

A note has one language, as a BCP 47 tag: `en`, `id`, or `pt-BR`. Two notes with the same
slug and two languages are translations of each other.

## Change an answer

Open **Settings → Site** or **Settings → Languages** in the sidebar. Change the answer,
then select **Save**. The sidebar shows a new site name at once.

To see the questions again, delete the rows of the table `setting`. Then open the CMS:

```sh
pnpm --filter @daluang/cms exec wrangler d1 execute DB --local --command 'delete from "setting"'
```

For the database of your Cloudflare account, use `--remote` in place of `--local`.
