# Write a post [Write, change, translate, and publish a post in the CMS]

A post is Markdown with its metadata. You write it in the CMS, and your site gets it when
you select **Publish changes**.

## Write a post

1. Open **Posts** in the sidebar, then select **New post**.
2. Type the title. The slug follows the title until you change the slug.
3. If the CMS has more than one language, choose the language of the post.
4. Type the description, the keywords, and the extra fields of your site.
5. Write the body in Markdown. Select **Preview** to see the body as Comark renders it.
6. Select **Save draft**. The list of posts opens, with the new draft.

The editor of the body is CodeMirror. It keeps the Markdown as you type it, also the
components of Comark, for example `::callout`. Your site gives each component its look.

## Change a post

1. Select the title of the post in the list.
2. Change the post, then select **Save**.

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
