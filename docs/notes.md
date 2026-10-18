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
  and the first publish sets `publishedAt`. The batch copies the working copy in SQL, so an
  edit that comes after the list also goes to the published copy.

## The draft

`noteDraftSchema` of `src/note-draft.ts` checks a draft against the settings of the CMS.
It gets the languages setting and the field definitions as `DraftRules`.

- The title, the slug, the description, and the keywords have the rules of the core
  metadata. A missing description is `""`, and missing keywords are `[]`.
- The language must be on the languages setting of the CMS.
- Each defined field must have the value type of its definition. A required field must
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
- `withTitle` makes the slug from the title with `slugify`, until the writer types a slug.
  `withSlug` keeps the typed slug. An empty slug follows the title again.
- `parseNoteForm` turns each input into the value of its type, then checks the draft with
  `noteDraftSchema`. An empty input is no value, so a required field asks for one.
- A number field with a text that is not a number keeps the text. The schema then tells
  the writer that the field needs a number.
- An error is a message for each path: `title`, or `fields.<name>` for an extra field.

## The inputs of the editor

- `PostForm` of `apps/cms/src/components/notes/post-form.tsx` shows the inputs of a
  `NoteForm`: the title, the slug, the language, the description, the keywords, the extra
  fields, and the body. It shows the error of each path of `NoteFormErrors`.
- The language choice shows only in a CMS with more than one language.
- `ExtraFieldInput` shows one extra field: a checkbox for yes or no, and a text box for a
  text, a number, or a list. A number asks for a decimal keyboard on a phone.
- `FormField` puts a label, a control, and its help text or its error together. An
  optional value has "(optional)" after its label.

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
- `POST /api/notes/<id>/publish` checks the note again with `noteDraftSchema` and the
  current settings, because a field can be required since its last save. A note that the
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
  list with `listPostsOfCms` of the browser client, which calls `GET /api/notes` and
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
- With no post, the page shows `NoPosts`: a link to a new post, and the steps to set up a
  site.

## The New post page

- `NewPost` of `apps/cms/src/components/notes/new-post.tsx` is the page of `/posts/new`.
  It starts with `emptyNoteForm` and shows `PostForm`.
- **Save draft** checks the form with `parseNoteForm`. An error shows at its input, and the
  page sends nothing. A valid draft goes to `addNote`. Then the page opens the list of
  posts.
- A refused save, for example a slug that another post has, shows its message above the
  buttons. **Cancel** goes back to the list.

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
