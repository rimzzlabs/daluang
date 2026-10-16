import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { D } from "@mobily/ts-belt";
import type { VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { type CSSProperties, createContext, useContext } from "react";
import { toggleVariants } from "./toggle";

interface ToggleGroupLook extends VariantProps<typeof toggleVariants> {
	spacing?: number;
	orientation?: "horizontal" | "vertical";
}

const ToggleGroupContext = createContext<ToggleGroupLook>({
	size: "default",
	variant: "default",
	spacing: 2,
	orientation: "horizontal",
});

export type ToggleGroupProps = ToggleGroupPrimitive.Props & ToggleGroupLook;

export function ToggleGroup(props: ToggleGroupProps) {
	const spacing = props.spacing ?? 2;
	const orientation = props.orientation ?? "horizontal";
	const rest = D.deleteKeys(props, [
		"className",
		"variant",
		"size",
		"spacing",
		"orientation",
		"children",
	]);
	const style: CSSProperties & Record<"--gap", number> = { "--gap": spacing };
	return (
		<ToggleGroupPrimitive
			data-slot="toggle-group"
			data-variant={props.variant}
			data-size={props.size}
			data-spacing={spacing}
			data-orientation={orientation}
			style={style}
			className={cn(
				"group/toggle-group flex w-fit flex-row items-center gap-[--spacing(var(--gap))] data-[spacing=0]:data-[variant=outline]:rounded-4xl data-vertical:flex-col data-vertical:items-stretch",
				props.className,
			)}
			{...rest}
		>
			<ToggleGroupContext.Provider
				value={{
					variant: props.variant,
					size: props.size,
					spacing,
					orientation,
				}}
			>
				{props.children}
			</ToggleGroupContext.Provider>
		</ToggleGroupPrimitive>
	);
}

export type ToggleGroupItemProps = TogglePrimitive.Props &
	VariantProps<typeof toggleVariants>;

export function ToggleGroupItem(props: ToggleGroupItemProps) {
	const context = useContext(ToggleGroupContext);
	const variant = context.variant || props.variant || "default";
	const size = context.size || props.size || "default";
	const rest = D.deleteKeys(props, ["className", "variant", "size"]);
	return (
		<TogglePrimitive
			data-slot="toggle-group-item"
			data-variant={variant}
			data-size={size}
			data-spacing={context.spacing}
			className={cn(
				"shrink-0 group-data-[spacing=0]/toggle-group:rounded-none group-data-[spacing=0]/toggle-group:px-3 group-data-[spacing=0]/toggle-group:shadow-none focus:z-10 focus-visible:z-10 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-end]:pr-2.5 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-start]:pl-2.5 group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-l-3xl group-data-vertical/toggle-group:data-[spacing=0]:first:rounded-t-3xl group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-r-3xl group-data-vertical/toggle-group:data-[spacing=0]:last:rounded-b-3xl data-[state=on]:bg-muted group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:border-l-0 group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:border-t-0 group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-l group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-t",
				toggleVariants({ variant, size }),
				props.className,
			)}
			{...rest}
		/>
	);
}
