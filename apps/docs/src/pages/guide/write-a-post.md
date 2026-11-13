# Write a post [Write, change, translate, and publish a post in the CMS]

A post is Markdown with its metadata. You write it in the CMS, and your site gets it when
you select **Publish changes**.

## Write a post

1. Open **Posts** in the sidebar, then select **New post**. The CMS adds an "Untitled"
   draft and opens it.
2. Type the title. The slug follows the title until you change the slug.
3. If the CMS has more than one language, choose the language of the post.
4. Type the description, the keywords, and the extra fields of your site.
5. Write the body in Markdown. Select **Split** to see the body beside the text as Comark
   renders it, or **Preview** to see only the body.

The CMS saves the post about 1 second after you stop typing. The bar below the post shows
"Saving", then "Saved". Press Ctrl+S (⌘S on a Mac) to save at once. Your site does not
change until you select **Publish changes**.

If a save fails, the bar shows the reason. The text stays on the page:

- If the CMS cannot reach the server, it tries again every 5 seconds.
- If your session ends, sign in again in another tab. The CMS then saves the text at
  the next try.
- If the CMS refuses a value, for example a slug that another post has, correct the
  value. The CMS then saves the post.

If you close the tab before the CMS saves the text, the browser asks you first.

If you open another page of the CMS before the CMS saves the text, the CMS sends the
text one last time. If the last save failed, or if a value is not correct, Daluang asks
you first. Select **Cancel** to stay on the post and correct the problem. If you leave the
page and the last send fails, the text is lost. Look at the bar before you leave the
post: it must show "Saved".

The editor of the body is CodeMirror. It keeps the Markdown as you type it, also the
components of Comark, for example `::callout`. Your site gives each component its look.

The toolbar above the body adds the Markdown of a heading, a mark, a list, a link, a code
block, a table, a rule, or a callout. Select the text first to change it. Ctrl+B (⌘B on a
Mac) makes the text bold, Ctrl+I makes it italic, and Ctrl+K makes a link.

## Change a post

1. Select the title of the post in the list, or in the panel of the posts beside the
   editor.
2. Change the post.

A save of a published post changes only the copy in the CMS. Your site keeps the
published copy until the next **Publish changes**. The list shows the post as "Edited".

## Translate a post

1. Open the post, then select **Translate**.
2. Select a language. The CMS copies the saved post into a new draft in that language,
   with the same slug, and opens the draft.
3. Translate the text, then select **Save**.

Two posts with the same slug in different languages are translations of each other.
**Translate** shows only the languages that have no translation of the post yet.

## Publish your changes

1. In the list, open the menu (**…**) of the post, then select **Publish**. The post gets
   the badge "To publish".
2. Select **Publish changes** in the navbar. The dialog lists each change.
3. Select **Publish changes** in the dialog. The CMS applies each change, then sends one
   `publish` event to each [webhook](/guide/webhooks).

The menu of a post also has **Unpublish**, **Delete**, and **Cancel the change**. An
unpublish and a delete of a published post also wait for **Publish changes**. A delete
of a draft is at once, after a confirmation.

| Badge        | Meaning                                                       |
| ------------ | ------------------------------------------------------------- |
| To publish   | The post goes to your site at the next **Publish changes**.   |
| Edited       | The post has a saved change that your site does not have yet. |
| To unpublish | The post leaves your site at the next **Publish changes**.    |
| To delete    | The CMS deletes the post at the next **Publish changes**.     |
