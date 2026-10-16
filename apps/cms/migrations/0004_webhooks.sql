-- The webhooks and their deliveries, for the webhooks domain (packages/webhooks). A
-- webhook is a URL that gets a POST, for example the deploy hook of a site. The URL is
-- the secret of a deploy hook, so the CMS shows it masked.
-- Do not edit an applied migration: add a new file.

create table "webhook" ("id" text not null primary key, "name" text not null, "url" text not null, "createdAt" text not null);

create table "webhook_delivery" ("id" text not null primary key, "webhookId" text not null references "webhook" ("id") on delete cascade, "event" text not null, "status" text not null, "statusCode" integer, "durationMs" integer not null, "createdAt" text not null);

create index "webhook_delivery_webhookId_idx" on "webhook_delivery" ("webhookId", "createdAt");
