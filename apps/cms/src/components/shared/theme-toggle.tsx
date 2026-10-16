import { Button } from "@daluang/ui/components/button";
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSyncExternalStore } from "react";
import { readTheme, subscribeTheme, type Theme, writeTheme } from "@/lib/theme";

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
			<HugeiconsIcon icon={theme === "dark" ? Sun03Icon : Moon02Icon} />
		</Button>
	);
}
