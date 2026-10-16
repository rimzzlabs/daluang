-- The settings of the CMS, for the settings domain (packages/settings).
-- One row for each setting: `site` and `languages`. The value is JSON, and the
-- schema of its key in packages/settings validates it on each read.
-- Do not edit an applied migration: add a new file.

create table "setting" ("key" text not null primary key, "value" text not null check (json_valid("value")), "updatedAt" text not null);
