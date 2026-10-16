import { type Auth, createAuth } from "../server";
import { readAuthEnv } from "./env";

// One instance for each isolate of the Worker. The bindings do not change between requests.
let auth: Auth | undefined;

export function getAuth(): Auth {
	auth ??= createAuth(readAuthEnv());
	return auth;
}
