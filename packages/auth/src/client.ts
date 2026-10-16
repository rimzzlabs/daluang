import { createAuthClient } from "better-auth/react";

/** The browser client of Better Auth. The CMS serves `/api/auth` on its own origin. */
export const authClient = createAuthClient();
