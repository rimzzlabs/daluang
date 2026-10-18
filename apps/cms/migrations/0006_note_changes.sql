-- The published copy and the mark of each note (packages/notes). The writer edits the
-- working copy: the other columns. The content API gives the published copy to the sites.
-- A mark (publish, unpublish, or delete) waits for Publish changes.
-- Do not edit an applied migration: add a new file.

alter table "note" add column "published" text;

alter table "note" add column "mark" text;

-- A note that is published already gets its working copy as its published copy.
update "note" set "published" = json_object('title', "title", 'slug', "slug", 'language', "language", 'description', "description", 'keywords', json("keywords"), 'fields', json("fields"), 'body', "body", 'updatedAt', "updatedAt") where "status" = 'published';
