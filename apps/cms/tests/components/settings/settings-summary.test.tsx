// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SettingsSummary } from "@/components/settings/settings-summary";

describe("SettingsSummary", () => {
	it("lists each answer by its own name", () => {
		render(
			<SettingsSummary
				settings={{
					site: { name: "rimzzlabs", url: null },
					languages: { languages: ["en", "ja"], defaultLanguage: "ja" },
				}}
			/>,
		);
		expect(screen.getByText("No address")).toBeTruthy();
		expect(screen.getByText("English, 日本語")).toBeTruthy();
		expect(screen.getByText("日本語")).toBeTruthy();
	});
});
