import type { APIRoute } from "astro";
import { getAuth } from "@/lib/auth/auth";

export const prerender = false;

/** Each endpoint of Better Auth: `/api/auth/sign-in/social`, `/api/auth/callback/github`, and more. */
export const ALL: APIRoute = (context) => getAuth().handler(context.request);
