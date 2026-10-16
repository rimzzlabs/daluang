// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SettingsSummary } from "../../src/components/settings-summary";

describe("SettingsSummary", () => {
	it("lists each answer by its own name", () => {
		render(
			<SettingsSummary
				settings={{
					site: { name: "rimzzlabs", url: null },
					languages: { languages: ["en", "su"], defaultLanguage: "su" },
				}}
			/>,
		);
		expect(screen.getByText("No address")).toBeTruthy();
		expect(screen.getByText("English, Basa Sunda")).toBeTruthy();
		expect(screen.getByText("Basa Sunda")).toBeTruthy();
	});
});
