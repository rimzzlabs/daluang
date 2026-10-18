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
