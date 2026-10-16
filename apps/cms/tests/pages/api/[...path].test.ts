import { describe, expect, it } from "vitest";
import { ALL } from "@/pages/api/[...path]";

describe("the endpoint of an unknown API path", () => {
	it("answers 404 as JSON", async () => {
		const response = ALL();
		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({ error: "not-found" });
	});
});
