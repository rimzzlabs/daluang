import { CircleHalfIcon } from "@phosphor-icons/react";
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

export interface ThemeToggleProps {
	className?: string;
}

export function ThemeToggle(props: ThemeToggleProps) {
	const theme = useSyncExternalStore(
		subscribeTheme,
		readTheme,
		readServerTheme,
	);
	const next = theme === "dark" ? "light" : "dark";

	return (
		<Button
			className={props.className}
			variant="ghost"
			size="icon"
			aria-label={`Use the ${next} theme`}
			onClick={() => writeTheme(next)}
		>
			{/* One icon for the two themes, so the server and the browser render the same. */}
			<CircleHalfIcon />
		</Button>
	);
}
