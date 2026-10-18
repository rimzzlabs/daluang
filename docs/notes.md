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
