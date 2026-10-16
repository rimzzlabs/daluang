import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	ApiTokensPage,
	LanguagesPage,
	MediaPage,
	WebhooksPage,
} from "@/routes/later-pages";

describe("later pages", () => {
	it.each([
		["Media", MediaPage, "Cloudflare R2"],
		["API tokens", ApiTokensPage, "read the published notes"],
		["Webhooks", WebhooksPage, "rebuild when you publish"],
		["Languages", LanguagesPage, "translation"],
	])("%s says what it will do and that it comes later", (title, Page, text) => {
		render(<Page />);
		expect(screen.getByRole("heading", { name: title })).toBeTruthy();
		expect(screen.getByText(new RegExp(text))).toBeTruthy();
		expect(screen.getByText("This page comes in a later step.")).toBeTruthy();
	});
});
