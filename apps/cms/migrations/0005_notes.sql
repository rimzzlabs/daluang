-- The notes, for the notes domain (packages/notes). The interface calls a note a post. A
-- row holds the core metadata, the extra fields as JSON, and the Markdown body. Two notes
-- with the same slug and different languages are translations of each other, so a slug is
-- unique in each language.
-- Do not edit an applied migration: add a new file.

create table "note" ("id" text not null primary key, "slug" text not null, "language" text not null, "title" text not null, "description" text not null, "keywords" text not null, "status" text not null, "publishedAt" text, "fields" text not null, "body" text not null, "createdAt" text not null, "updatedAt" text not null);

create unique index "note_slug_language_idx" on "note" ("slug", "language");

create index "note_updatedAt_idx" on "note" ("updatedAt");
