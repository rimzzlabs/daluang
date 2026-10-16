import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useSyncExternalStore } from "react";
import {
	readTheme,
	subscribeTheme,
	type Theme,
	writeTheme,
} from "../lib/theme";
import { Button } from "./button";

function readServerTheme(): Theme {
	return "light";
}

export function ThemeToggle() {
	const theme = useSyncExternalStore(
		subscribeTheme,
		readTheme,
		readServerTheme,
	);
	const next = theme === "dark" ? "light" : "dark";

	return (
		<Button
			variant="ghost"
			size="icon"
			aria-label={`Use the ${next} theme`}
			onClick={() => writeTheme(next)}
		>
			{theme === "dark" ? <SunIcon /> : <MoonIcon />}
		</Button>
	);
}
