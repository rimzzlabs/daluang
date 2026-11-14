# Import posts [Import Markdown or MDX files as posts, with the dates and the values of their frontmatter]

You can import the posts of an old site into the CMS. Each Markdown or MDX file becomes a
draft. Your site does not change until you select **Publish changes**.

## Before the import

If your files have keys that your site reads, for example `featured` or `relatedPosts`,
add these fields first. Open **Settings → Fields**, and give each field its type. The
import then checks each value against the type of its field. For the steps, see
[First sign-in](/guide/first-sign-in).

## What a file needs

A file is Markdown or MDX, with YAML frontmatter between two lines of `---`:

```md
---
title: Jotai recipes
slug: jotai-recipes
description: Small recipes for Jotai.
keywords: [react, jotai]
publishedAt: 2023-09-30
updatedAt: 10/02/2023
status: published
featured: true
---

The body of the post.
```

The import reads these keys:

| Key           | What the import does                                                                                           |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| `title`       | The title of the post. A file with no title is not imported.                                                   |
| `slug`        | The slug. If the file has no slug, the import uses the file name with no `.md` or `.mdx`, then the title.      |
| `description` | The description. If the file has no description, the description is empty.                                     |
| `keywords`    | The keywords: a list, or one text with a comma between two keywords.                                           |
| `publishedAt` | The date of the first publish. Your site gets this date.                                                       |
| `updatedAt`   | The date of the last change. If the file has no `updatedAt`, the import uses `publishedAt`.                    |
| `status`      | If the status is `published`, the post can get the mark To publish. See [After the import](#after-the-import). |

Each other key becomes an extra field of the post, with its value. A value is a text, a
number, `true` or `false`, or a list of texts. If **Settings → Fields** has no field with
that name, the post keeps the value, but the editor does not show it. The keys `language`
and `lang` do nothing: the post gets the language that you choose for the import.

The import reads a date in these forms:

- `YYYY-MM-DD`, for example `2023-09-30`
- `MM/DD/YYYY`, for example `09/30/2023`. The month comes first.
- an ISO date and time with `Z` or an offset, for example `2023-09-30T10:00:00+07:00`

A date with no time is midnight UTC of that day. The import does not read a date and time
with no zone, because the zone is not known.

A file can have a size of 1 MB or less. A file with many `"` characters can be too large
to send also, because each `"` takes more room in the request. The row of the file then
says: "The file is too large to send."

## Import the files

1. Open **Posts** in the sidebar, then select **Import**.
2. Choose the files. You can choose more than one file.
3. If the CMS has more than one language, choose the language of the files. Each file of
   this import gets this language.
4. Select **Import**.

The CMS sends the files one at a time, in the order of their names. Each file has a row
that shows its state. During the import, the dialog does not close. After the first run,
you cannot change the files or the language: one import has one language. To import other
files, select **Done**, then select **Import** again.

If your session ends, or if the CMS cannot reach the server, the import stops at that
file. Sign in again in another tab, or check your connection. Then select **Import**
again. The CMS continues with the files that it did not send. It sends a failed file
again only when a retry can help, and it never sends an imported file again.

When the import ends, the dialog shows the number of imported, skipped, and failed files.
Select **Done** to close the dialog.

## What happens to MDX

The CMS keeps Markdown with the components of Comark. The import changes the MDX syntax
of a body in this way:

- The import removes the `import` lines at the start of the body.
- A component on lines of its own, with only text props, becomes a component of Comark.
  For example, `<Callout type="note">` becomes `::callout{type="note"}`, and the block ends
  with `::`.
- Each other component stays as it is, and the row of the file shows a warning. For
  example, a component with a prop such as `width={200}`, or a component in a line of
  text, stays.

## The warnings

A warning tells you that a part of the file needs a check. A post with a warning is a
plain draft: it does not get the mark To publish.

| Warning                                                             | What to do                                                                                              |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| The component `NoteImage` stays as it is (11 uses).                 | Open the post, and change each use of the component by hand.                                            |
| The import left out the key "cover".                                | The name or the value of the key is not correct. If the post needs it, add it by hand.                  |
| The import cannot read "publishedAt", so the post has no such date. | Correct the date in the file with a date form of this page. Delete the post, and import the file again. |

The CMS does not keep the warnings. Read them before you close the dialog.

## Skipped and failed files

- **Skipped**: a post with the same slug is in this language already. The import does not
  change that post. If you want the file as a new post, give it another slug.
- **Failed**: the row tells the reason, for example a frontmatter that is not correct YAML,
  a file with no title, or a value that the CMS does not accept. A value that the CMS does
  not accept shows the name of its field. Correct the file, then import it again.
- If the browser cannot read a file, select **Done**, select **Import** again, and choose
  the file again.

## Translations

Two posts with the same slug in different languages are translations of each other. If
your site has the same file name in two languages, import each language in its own run:

1. Import the files of the first language, with that language.
2. Select **Done**, then select **Import** again.
3. Import the files of the second language, with that language.

## After the import

A file with `status: published` gets the mark To publish when it has no warning and each
required field has a value. Each other file becomes a plain draft.

1. Select **Publish changes** in the navbar. The CMS publishes each post with the mark.
   Your site gets the dates of the files.
2. Open each post with the label Draft, check it, then publish it. See
   [Write a post](/guide/write-a-post).
