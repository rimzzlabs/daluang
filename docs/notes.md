# Notes

This page tells how the CMS keeps a note. The interface calls a note a post. The code is
in `packages/notes`.

## The store

- **D1 keeps each note in one row of the table `note`**
  (`apps/cms/migrations/0005_notes.sql`), with its metadata, its extra fields, and its
  body. The keywords and the extra fields are JSON text.
- **A slug is unique in each language.** The unique index `note_slug_language_idx`
  refuses a second note with the same slug and language. Two notes with the same slug and
  different languages are translations of each other (`src/translation.ts`).
- `src/env.ts` has the schema of the `DB` binding of the domain.
