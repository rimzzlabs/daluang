import { describe, expect, it } from "vitest";
import { NOT_ALLOWED_ERROR_CODE, signInError } from "../src/sign-in-error";

describe("signInError", () => {
	it("gives no error when there is no code", () => {
		expect(signInError(null)).toBeNull();
		expect(signInError("")).toBeNull();
	});

	it("gives the message of the allow list, with no code to show", () => {
		const error = signInError(NOT_ALLOWED_ERROR_CODE);
		expect(error?.message).toContain("ALLOWED_GITHUB_USERS");
		expect(error?.code).toBeNull();
	});

	it.each(["state_mismatch", "state_not_found", "please_restart_the_process"])(
		"tells the person that the sign-in expired for %s",
		(code) => {
			expect(signInError(code)).toEqual({
				message: "The sign-in expired. Try again.",
				code: null,
			});
		},
	);

	it("tells the person to add an email address on GitHub", () => {
		expect(signInError("email_not_found")?.message).toContain("email address");
	});

	it("gives a general message and the code for a code with no message", () => {
		expect(signInError("MISSING_FIELD")).toEqual({
			message: "The sign-in with GitHub failed. Try again.",
			code: "MISSING_FIELD",
		});
	});

	it("does not show a code that is not a plain code", () => {
		expect(signInError("<script>alert(1)</script>")?.code).toBeNull();
	});
});
