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
  `readNote`, `addNote`, `saveNote`, `deleteNoteOfCms`, and `changeNoteStatus` for a
  publish or an unpublish. Each one gives an `R.Result`, and it does not throw.
- An error is a code of `NotesError`, and `NOTES_ERROR_MESSAGES` has the message of each
  code. A 409 gives `slug-taken` or `settings-needed` from the `error` of its body.
- The client reads each answer with `noteSchema` or `noteSummarySchema` of `src/note.ts`.
  An answer that the schema refuses gives `server`.
- The editor checks a draft with `noteDraftSchema` before a save, so the writer sees the
  message of each field. A 422 of the server gives `invalid`.

## Publish

- `POST /api/notes/<id>/publish` checks the note again with `noteDraftSchema` and the
  current settings, because a field can be required since its last save. A note that the
  check refuses answers 422. The route file is
  `apps/cms/src/pages/api/notes/[id]/[action].ts`.
- A publish sets the status `published` with `setNoteStatus` of the store. The first
  publish sets `publishedAt`, and a later publish keeps it. A publish of a published note
  sends its saved changes to the sites.
- `POST /api/notes/<id>/unpublish` sets the status `draft` and keeps `publishedAt`. A
  draft stays a draft, with no event.
- Each publish and each unpublish tells each site to rebuild: the handler calls `notify`
  with `publish` or `unpublish`. A `DELETE` of a published note sends `unpublish`.
- The handler gets `notify` as a parameter, so the notes package does not import the
  webhooks package. `notifySites` of `apps/cms/src/lib/notes/notify.ts` gives each event
  to `deliverEvent` of the webhooks package.
- A save of a published note sends no event. The next publish or the next build of a site
  takes the change.

## The content API

- `GET /api/content/notes` gives each published note to a site, the last published first.
  A draft is not in the list. `handleContentRequest` of `src/content.ts` answers, and the
  route file is `apps/cms/src/pages/api/content/notes.ts`.
- Each note has its metadata, its extra fields, its Markdown as `body`, and its Comark
  document as `document`. `parseMarkdown` of `comark` makes the document: a node is a
  string, or `[tag, props, ...children]`. A site maps each tag to a component of its own.
- The CMS does not highlight code. A `pre` node keeps the language, and the rest of the
  first line of the fence stays as `meta`, so each site highlights with its own Shiki.
- A site sends `Authorization: Bearer dlg_…`. The handler gets `authorize` as a parameter,
  and `authorizeSite` of `apps/cms/src/lib/notes/authorize.ts` checks the token with
  `verifyApiToken`. A request with no valid token answers 401, with
  `WWW-Authenticate: Bearer`. Another method answers 405.
- The sign-in guard needs no session below `/api/content/` (`docs/auth.md`).
