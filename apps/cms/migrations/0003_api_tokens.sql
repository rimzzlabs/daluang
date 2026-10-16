-- The API tokens, for the API tokens domain (packages/api-tokens). A site reads the
-- published notes with a token. The table keeps the SHA-256 hash of each token, not the
-- token. `start` is the start of the token, to tell the tokens apart in a list.
-- Do not edit an applied migration: add a new file.

create table "api_token" ("id" text not null primary key, "name" text not null, "hash" text not null unique, "start" text not null, "createdAt" text not null, "lastUsedAt" text);
