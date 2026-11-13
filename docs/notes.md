# Notes

This page tells how the CMS keeps a note. The interface calls a note a post. The code is
in `packages/notes`.

## The model

- A note has the core metadata of `noteMetadataSchema` (`src/metadata.ts`), the extra
  fields of the site (`src/extra-fields.ts`), and a Markdown body. `src/note.ts` has the
  types: `Note`, `NoteSummary` for a list, and `NoteDraft` for what a writer gives.
- A writer gives a `NoteDraft`: the title, the slug, the language, the description, the
  keywords, the extra fields, and the body. The CMS sets the ID, the status, and the
  dates. A new note is a draft.

## The published copy and the mark

- A note has a working copy, which the writer edits, and a published copy, which the
  sites read. The column `published` of `apps/cms/migrations/0006_note_changes.sql` holds
  the published copy as JSON (`PublishedCopy`), or `null` when the sites do not have the
  note.
- The column `mark` holds `publish`, `unpublish`, or `delete` (`NOTE_MARKS`), or `null`.
  A mark waits for Publish changes. `markNote` of the store writes it.
- `noteChange` of `src/change.ts` gives the change of a note, or `None`: `publish` for a
  marked note that the sites do not have, `edit` for a published note whose working copy
  differs from its published copy, `unpublish` and `delete` for a marked note.
- `isPublishedCopy` compares the content only: the title, the slug, the language, the
  description, the keywords, the extra fields, and the body. A save with no change of
  content makes no change.

## Publish changes in the store

- `listChanges` of the store gives each note with a change (`PendingChange`): its summary
  and its change, the last changed first.
- `applyChanges` applies each change in one D1 batch, which is one transaction. A
  `publish` and an `edit` copy the working copy to the published copy, an `unpublish`
  clears the published copy, and a `delete` removes the note. Each one clears the mark,
  and the first publish sets `publishedAt`. A later publish keeps it. The batch copies the
  working copy in SQL, so an edit that comes after the list also goes to the published
  copy.
- **Only `applyChanges` publishes a note.** No other function of the store writes the
  status or the published copy. A test publishes with `publishNotes` of
  `packages/notes/tests/publish.ts`: a mark, then `applyChanges`.

## The draft

`noteDraftSchema` of `src/note-draft.ts` checks a draft against the settings of the CMS.
It gets the languages setting and the field definitions as `DraftRules`.

- The title, the slug, the description, and the keywords have the rules of the core
  metadata. A missing description is `""`, and missing keywords are `[]`.
- The language must be on the languages setting of the CMS.
- Each defined field must have the value type of its definition.
- A saved draft can have an empty required field, so the writer does not lose text.
  `publishedDraftSchema` adds the required check for Publish: a required field must
  have a value, and a required text or list must not be empty.
- An extra field that the settings do not define stays as it is, so a value from another
  source is not lost.
- The body has a limit of 1 MB (`NOTE_BODY_MAX_BYTES`): half of the size limit of a row of
  D1.

## The form of the editor

`src/note-form.ts` holds the form of the editor as pure functions. The editor keeps a
`NoteForm`, and it sends the draft of `parseNoteForm`.

- `NoteForm` keeps each value as its input gives it: text, or yes or no for a boolean
  field. The keywords are one text, with a comma between two keywords.
- `emptyNoteForm` starts a new post in the default language, with an empty input for each
  defined field.
- `noteFormOf` gives the form of a stored post. Its slug counts as typed, so a new title
  does not change the address of the post. An untitled draft that was never published
  is the exception (`isUntitledSlug`): its slug follows the title. A stored value of another type becomes text.
- `kept` holds the stored extra fields that the settings do not define. The editor does
  not show them, and `parseNoteForm` puts them back in the draft, so a save keeps them.
- `withTitle` makes the slug from the title with `slugify`, until the writer types a slug.
  `withSlug` keeps the typed slug. An empty slug follows the title again.
- `parseNoteForm` turns each input into the value of its type, then checks the draft with
  `noteDraftSchema`. An empty input is no value. Publish asks for the value of a
  required field.
- A number field with a text that is not a number keeps the text. The schema then tells
  the writer that the field needs a number.
- An error is a message for each path: `title`, or `fields.<name>` for an extra field.

## The inputs of the editor

- `apps/cms/src/components/notes/post-form.tsx` shows the inputs of a `NoteForm` in two
  parts. `PostDetailsFields` has the title, the slug, the language, the description, the
  keywords, and the extra fields. `PostBodyField` has the body. Each part shows the error
  of each path of `NoteFormErrors`.
- `EditPostForm` puts the body in the middle and the details in a panel at the right, from
  80rem (`xl`, `useIsWide` of `@daluang/ui`). On a smaller screen, **Details** opens the
  details in a sheet, and it shows the number of their errors. Only one copy of the
  details renders at a time, so each input keeps one ID.
- The language choice shows only in a CMS with more than one language.
- `ExtraFieldInput` shows one extra field: a checkbox for yes or no, and a text box for a
  text, a number, or a list. A number asks for a decimal keyboard on a phone.
- `MarkdownEditor` of `apps/cms/src/components/notes/markdown-editor.tsx` is the input of
  the body: CodeMirror 6 with the syntax of Markdown, the undo history, and the default
  keys. CodeMirror keeps its own text. The editor reads the first text one time, and it
  gives each change to the form.
- The highlight style of the editor uses the tokens of the theme, so it follows the dark
  theme.
- `EditorToolbar` of `apps/cms/src/components/notes/editor-toolbar.tsx` is above the
  body: undo and redo, then the text actions of `markdownEdit`. It is a toolbar of
  WAI-ARIA: Tab goes to one button, and the arrow keys, Home, and End move between the
  buttons. Each button has a tooltip with its name.
- `MarkdownEditor` applies an action as one transaction, and gives the focus back to the
  text. Mod-B, Mod-I, and Mod-K apply bold, italic, and link from the text.
- `PostBodyField` loads the editor with `lazy`. CodeMirror and the grammars of Markdown are
  about 500 KB, so only the pages of the editor load them. A skeleton shows until the
  editor loads.
- **Write**, **Split**, and **Preview** above the body switch the view. Split shows the
  preview beside the text from 64rem (`lg`), and below the text on a smaller screen. The
  editor stays in the page during the preview, so it keeps its text and its undo history.
- The editor numbers the lines, and tints the line of the cursor with the `muted` token.
- `PostPreview` of `apps/cms/src/components/notes/post-preview.tsx` parses the body with
  `parseMarkdown` of `comark`, and renders the document with `MarkdownDocument` of
  `@comark/react`. A component of Comark shows with its tag, because each site maps the
  tag to its own component. The class `post-preview` of the global CSS gives one plain
  style. `PostBodyField` loads the preview with `lazy`.
- `PostPreview` does not use `MarkdownClient` of `@comark/react`. That component makes a
  promise during the render, and a new preview can wait for its promise without end.
- `FormField` puts a label, a control, and its help text or its error together. An
  optional value has "(optional)" after its label.

## The text actions of the toolbar

- `markdownEdit` of `src/markdown-edit.ts` gives the change of the body for one action of
  the toolbar (`MARKDOWN_EDITS`). It gets the text and the selection, and gives one
  `TextEdit`: the range, the new text, and the new selection. The editor applies it as one
  transaction, so one undo removes it.
- Bold, italic, strikethrough, and inline code put their marks around the selection, or
  remove the marks when they are there. With no selection, the cursor goes between them.
- Heading, quote, bullet list, and numbered list give a prefix to each line of the
  selection, or remove it when each line has it. Heading puts `## ` in place of another
  level.
- Link makes `[text](https://)`, and selects the URL. Code block and callout
  (`::callout{type="note"}`) put the selected lines in a block, or select a placeholder.
  Table and rule go after the line of the cursor.

## Translations

- Two notes with the same slug and different languages are translations of each other.
  `translationsOf` of `src/translation.ts` gives them.
- `missingLanguages` gives each language of the CMS that has no translation of a note
  yet, in the order of the setting.
- `translationDraft` copies a note into another language, with the same slug. The writer
  then translates its text.
- **Translate** on the page of a post opens `TranslatePost` of
  `apps/cms/src/components/notes/translate-post.tsx`. It lists the posts, and shows each
  language from `missingLanguages`. A click adds the copy of the saved post with
  `addNote`, and the page of the new draft opens. A CMS with one language shows no
  Translate.

## The store

- **D1 keeps each note in one row of the table `note`**
  (`apps/cms/migrations/0005_notes.sql`), with its metadata, its extra fields, and its
  body. The keywords and the extra fields are JSON text.
- **A slug is unique in each language.** The unique index `note_slug_language_idx`
  refuses a second note with the same slug and language. Two notes with the same slug and
  different languages are translations of each other (`src/translation.ts`).
- `src/store.ts` has the functions of the store. Each one gets the D1 binding as a
  parameter: `listNotes`, `findNote`, `createNote`, `updateNote`, and `deleteNote`.
- `listNotes` gives a `NoteSummary` of each note, the last changed first. A summary has no
  body, so a long list stays small.
- `updateNote` changes the draft and `updatedAt`. It keeps the status, `publishedAt`, and
  `createdAt`.
- `findNote` gives `None` for a row that its schema refuses, for example a row with JSON
  that does not parse. `listNotes` reads only the columns of a summary, and it skips a row
  whose summary is not valid.
- `createNote` and `updateNote` throw when D1 refuses the slug: another note has it in the
  same language.
- `src/env.ts` has the schema of the `DB` binding of the domain.

## The endpoint

- `GET /api/notes` gives the summary of each note. `POST /api/notes` adds a draft and
  answers 201 with the note.
- `GET /api/notes/<id>` gives one note with its body. `PATCH /api/notes/<id>` writes a
  draft over it and gives the changed note. `DELETE /api/notes/<id>` deletes it and
  answers 204. An ID that no note has answers 404.
- `handleNotesRequest` of `src/api.ts` answers. The route files are
  `apps/cms/src/pages/api/notes.ts` and `apps/cms/src/pages/api/notes/[id].ts`.
- The route file reads the stored settings with `readSettings` of the settings package,
  and gives them to the handler. The settings package imports the notes package, so the
  notes package cannot import the settings.
- A draft that `noteDraftSchema` refuses answers 422, with the path and the message of
  each issue. A slug that another note has in the same language answers 409 (`slug-taken`).
- Before the onboarding saves the languages, a write answers 409 (`settings-needed`).
- A body of another type answers 415, a body that is not JSON 400, and a body above
  `NOTE_BODY_MAX_BYTES` and 64 KB of metadata 413.

## The browser client

- `apps/cms/src/lib/notes/client.ts` calls the endpoint from the browser: `listNotesOfCms`,
  `readNote`, `addNote`, `saveNote`, `deleteNoteOfCms`, and `markNoteOfCms` for a
  publish, an unpublish, or a cancel. Each one gives an `R.Result`, and it does not throw.
- An error is a code of `NotesError`, and `NOTES_ERROR_MESSAGES` has the message of each
  code. A 409 gives `slug-taken` or `settings-needed` from the `error` of its body.
- `SAVE_ERROR_OUTCOMES` tells the autosave what to do after each code. `invalid`,
  `slug-taken`, `settings-needed`, and `not-found` give `refused`. `signed-out`,
  `offline`, and `server` give `failed`, so the autosave tries again.
- The client reads each answer with `noteSchema` or `noteSummarySchema` of `src/note.ts`.
  An answer that the schema refuses gives `server`.
- The editor checks a draft with `noteDraftSchema` before a save, so the writer sees the
  message of each field. A 422 of the server gives `invalid`.
- `listChangesOfCms` gives the changes and their number, and `publishChanges` is Publish
  changes: it gives the number of applied changes.
- `createChangesStore` of `apps/cms/src/lib/notes/changes-store.ts` keeps the number of
  changes in the browser, and `useChangeCount` of `apps/cms/src/hooks/notes/` renders a
  component again after each write.

## Publish

- **The sites change only at Publish changes.** Publish, unpublish, and delete only mark
  a note, and they send no event.
- `POST /api/notes/<id>/publish` checks the note with `publishedDraftSchema` and the
  current settings: each required field must have a value. A note that the
  check refuses answers 422. Then it marks a note that the sites do not have `publish`. A
  published note loses its mark, so an unpublish or a delete that waits stops. The route
  file is `apps/cms/src/pages/api/notes/[id]/[action].ts`.
- `POST /api/notes/<id>/unpublish` marks a published note `unpublish`. For a note that the
  sites do not have, it clears the mark, so a publish that waits stops.
- `POST /api/notes/<id>/cancel` clears the mark of a note.
- A `DELETE` of a published note marks it `delete` and answers 200 with the note. A
  `DELETE` of a note that the sites do not have deletes it at once and answers 204.
- A save of a published note changes only its working copy. `noteChange` then gives
  `edit`, so the change waits for Publish changes also.

## Publish changes

- `GET /api/changes` gives `count` and each change. `POST /api/changes` is Publish
  changes: `applyChanges` applies each change, and the handler calls `notify` with
  `publish` one time when it applied a change. Ten changes then cost one rebuild of each
  site. `handleChangesRequest` of `src/changes.ts` answers, and the route file is
  `apps/cms/src/pages/api/changes.ts`.
- The handler gets `notify` as a parameter, so the notes package does not import the
  webhooks package. `notifySites` of `apps/cms/src/lib/notes/notify.ts` gives the event to
  `deliverEvent` of the webhooks package.

## The list of the posts

- `listedNotes` of `src/note-list.ts` gives each note of `GET /api/notes` with its change
  of `GET /api/changes`, or `null` for a note with no change. The order of the notes
  stays.
- `dayLabel` of `src/date-label.ts` gives the day of an ISO time for a list, in English,
  in the time zone of the browser: `Oct 18, 2026`.
- `Posts` of `apps/cms/src/components/notes/posts.tsx` is the posts page. It reads the
  list with `usePostList` of `apps/cms/src/hooks/notes/use-post-list.ts`. The hook calls
  `listPostsOfCms` of the browser client, which calls `GET /api/notes` and
  `GET /api/changes` together and joins them with `listedNotes`.
- `PostList` shows each post: the title, the slug, the day of the last change, the
  language, the status, and the change. `CHANGE_LABELS` and `STATUS_LABELS` of
  `apps/cms/src/lib/notes/change-labels.ts` name them, also in the dialog of Publish
  changes.
- In a CMS with more than one language, `LanguageFilter` shows All and each language of
  the settings. `inLanguage` of `src/note-list.ts` keeps the posts of the chosen
  language.
- `PostMenu` is the menu of each post. `noteActions` of `src/note-list.ts` gives its
  items: Publish for a draft, Unpublish for a published post, and Cancel the change for a
  post with a mark. An edit has no mark, so its menu shows Unpublish. Each post also has
  Delete, with the exception of a post that waits to delete.
- Delete opens `DeletePostDialog`, which asks for a confirmation and calls
  `deleteNoteOfCms`. A draft goes at once. A published post only gets the mark `delete`,
  so its site keeps it until Publish changes.
- An item calls `markNoteOfCms`. Then the page reads the list again, so the badges and
  the number of the navbar change. A failed mark shows its message above the list.
- The page writes the number of changes of the server to the store of the navbar.
- The header of the page has **New post**, a link to `/posts/new`.
- The posts page is at `/posts`. With no post, it shows `NoPosts`: a link to a new post.
  The steps to set up a site are on the dashboard (`docs/app-shell.md`).

## The explorer of the editor

- The pages of the editor show `PostExplorer` of
  `apps/cms/src/components/notes/post-explorer.tsx` at the left of the post. It shows from
  64rem (`lg`), where the editor has the room for it.
- The explorer has a search, the filter All / Drafts / Published, the number of the posts
  that match, and a link to each post. The link of the open post has
  `aria-current="page"`.
- `explorerNotes` of `src/note-list.ts` gives the posts of the search and the filter. The
  search finds the text in the title or the slug, with no difference between capitals and
  small letters.
- The page reads the list with `usePostList`, and reads it again after a save and after a
  new translation. The explorer then shows the new title.

## The New post page

- `NewPost` of `apps/cms/src/components/notes/new-post.tsx` is the page of `/posts/new`.
  It adds a draft at once, then opens the page of the draft. Autosave needs a stored
  post, and the editor then keeps its cursor and its undo history.
- `untitledDraft` of `src/note-draft.ts` gives the draft: "Untitled" with the slug
  `untitled`, in the default language. `freeSlug` of `src/translation.ts` gives the first
  slug that the language does not have, so a second draft is "Untitled 2" with
  `untitled-2`.
- The page of the draft replaces `/posts/new` in the history, so Back does not add a
  second draft.
- A refused draft shows its message, with **Try again** and a link back to the list.

## The page of a post

- The title of each post in the list is a link to `/posts/<id>`. `PostLink` is a router
  link in the island, and a plain link in the HTML of the server.
- `EditPost` of `apps/cms/src/components/notes/edit-post.tsx` is the page of
  `/posts/<id>`. It reads the post with `readNote`, and shows its status and
  `EditPostForm`. A key of the ID resets the page for another post. A post that does not
  exist shows its message, with a link back to the list.
- `EditPostForm` of `apps/cms/src/components/notes/edit-post-form.tsx` is the form of a
  stored post. It starts with `noteFormOf`, and it saves by itself: there is no Save
  button.
- **Autosave.** `useAutosave` of `apps/cms/src/hooks/notes/use-autosave.ts` sends the
  draft to `saveNote` 1 s after the last change (`AUTOSAVE_DELAY_MS`). The sites change
  only at Publish changes, so a save is safe. Mod-S saves at once.
- One save runs at a time. A change during a save waits, then the next save sends the
  last form, so an old form never comes after a new one.
- The save gives an outcome (`AutosaveOutcome` of the browser client): `saved`,
  `refused`, or `failed`. The hook keeps the last form until a save of that form gives
  `saved`. A newer form replaces the kept form, and the hook never sends an old form
  again.
- `refused`: a retry cannot help. A form that is not valid gives `refused`. The error
  codes `invalid`, `slug-taken`, `settings-needed`, and `not-found` also give `refused`.
  The hook waits for the next change of the writer.
- `failed`: a retry can help, for example when the writer is offline or signs in again
  in another tab. The error codes `signed-out`, `offline`, and `server` give `failed`.
  The hook sends the kept form again after 5 s (`AUTOSAVE_RETRY_MS`), until a save
  succeeds. A change during that wait uses the normal wait of 1 s.
- `SAVE_ERROR_OUTCOMES` of the browser client gives the outcome of each `NotesError`.
- Mod-S sends a kept form again, also after `refused`.
- When the form goes away because the writer opens another page of the CMS, the hook
  sends the form one last time. After that, the hook does not try again. If the last
  send fails, the text is lost. A later change will add a confirmation before the writer
  leaves the page.
- A close or a reload of the browser tab runs no code of the hook, so the hook sends
  nothing. The browser asks before it closes the tab while a form is not saved.
- A save of a published post changes only its working copy. After a save,
  `refreshChangeCount` reads the number of changes again for the navbar.
- `PostStatusBar` of `apps/cms/src/components/notes/post-status-bar.tsx` is below the
  form. It shows the words, the characters, and the read time of the body, from
  `bodyStats` of `src/body-stats.ts`, then "Not saved yet", "Saving", "Saved", "Not saved: correct the
  marked values", or the error of the save.
- "Saved" shows only when no newer change waits. When a save ends, its result replaces
  the status only if the status is still "Saving". A change during the save sets "Not
  saved yet", and that status stays until the save of the change.
- After `failed`, the message tells the writer that the post is not saved and that
  Daluang tries again in 5 seconds. After the end of the session, the message tells the
  writer to sign in again in another tab, and that the text stays on the page. After
  `refused`, the message is the message of the error in `NOTES_ERROR_MESSAGES`.
- `bodyStats` counts a word from its first letter or digit, so a mark of Markdown alone,
  such as `#` or `---`, is not a word. It counts each code point as one character. The
  read time is the words divided by 200 (`WORDS_PER_MINUTE`), rounded up.

## The Publish changes button

- `PublishChanges` of `apps/cms/src/components/notes/publish-changes.tsx` is in the
  navbar of each page. It shows the number of changes. With no change, it shows nothing.
- `[...path].astro` counts the changes with `listChanges` before the render. The server
  HTML and the island then show the same number, with no request from the browser.
- A click opens a dialog with the list of `listChangesOfCms`: the title, the language, and
  the change of each note. The list also writes the new number to the store.
- **Publish changes** in the dialog calls `publishChanges`. If it succeeds, the store gets
  0, so the button goes away. If it fails, the dialog stays open with the message, and
  the number stays.

## The content API

- `GET /api/content/notes` gives the published copy of each note to a site, the last
  published first. A note with no published copy is not in the list.
  `handleContentRequest` of `src/content.ts` answers, and the route file is
  `apps/cms/src/pages/api/content/notes.ts`.
- **A site never gets the working copy or the mark.** An edit of a published note stays
  in the working copy until the published copy changes.
- Each note has its published metadata, its extra fields, its Markdown as `body`, its ID,
  `status`, `publishedAt`, `createdAt`, and its Comark document as `document`. `parseMarkdown` of `comark` makes the document: a node is a
  string, or `[tag, props, ...children]`. A site maps each tag to a component of its own.
- The CMS does not highlight code. A `pre` node keeps the language, and the rest of the
  first line of the fence stays as `meta`, so each site highlights with its own Shiki.
- A site sends `Authorization: Bearer dlg_…`. The handler gets `authorize` as a parameter,
  and `authorizeSite` of `apps/cms/src/lib/notes/authorize.ts` checks the token with
  `verifyApiToken`. A request with no valid token answers 401, with
  `WWW-Authenticate: Bearer`. Another method answers 405.
- The sign-in guard needs no session below `/api/content/` (`docs/auth.md`).
