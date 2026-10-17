export const WEBHOOK = {
	id: "w1",
	name: "Site",
	urlHint: "example.com/…c3d4",
	createdAt: "2026-10-17T00:00:00.000Z",
	deliveries: [],
};

export const DELIVERY = {
	id: "d1",
	event: "test" as const,
	status: "delivered" as const,
	statusCode: 200,
	durationMs: 12,
	createdAt: "2026-10-17T00:00:00.000Z",
};

/** The messages of the fake of `@/lib/webhooks/client`. */
export const MESSAGES = {
	invalid: "Invalid.",
	"too-many": "Too many.",
	"not-found": "Not found.",
	"signed-out": "Signed out.",
	offline: "Offline.",
	server: "Server.",
};
