import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { D } from "@mobily/ts-belt";
import { CaretRightIcon, CheckIcon } from "@phosphor-icons/react";
import { cn } from "cn";
import type { ComponentProps } from "react";

export function DropdownMenu(props: MenuPrimitive.Root.Props) {
	return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

export function DropdownMenuPortal(props: MenuPrimitive.Portal.Props) {
	return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

export function DropdownMenuTrigger(props: MenuPrimitive.Trigger.Props) {
	return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

export function DropdownMenuContent(
	props: MenuPrimitive.Popup.Props &
		Pick<
			MenuPrimitive.Positioner.Props,
			"align" | "alignOffset" | "side" | "sideOffset"
		>,
) {
	const rest = D.deleteKeys(props, [
		"align",
		"alignOffset",
		"side",
		"sideOffset",
		"className",
	]);
	return (
		<MenuPrimitive.Portal>
			<MenuPrimitive.Positioner
				className="isolate z-50 outline-none"
				align={props.align ?? "start"}
				alignOffset={props.alignOffset ?? 0}
				side={props.side ?? "bottom"}
				sideOffset={props.sideOffset ?? 4}
			>
				<MenuPrimitive.Popup
					data-slot="dropdown-menu-content"
					className={cn(
						"z-50 max-h-(--available-height) w-(--anchor-width) min-w-48 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-2xl bg-popover p-1 text-popover-foreground shadow-2xl ring-1 ring-foreground/5 duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95",
						props.className,
					)}
					{...rest}
				/>
			</MenuPrimitive.Positioner>
		</MenuPrimitive.Portal>
	);
}

export function DropdownMenuGroup(props: MenuPrimitive.Group.Props) {
	return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

export function DropdownMenuLabel(
	props: MenuPrimitive.GroupLabel.Props & {
		inset?: boolean;
	},
) {
	const { className, inset, ...rest } = props;
	return (
		<MenuPrimitive.GroupLabel
			data-slot="dropdown-menu-label"
			data-inset={inset}
			className={cn(
				"px-3 py-2.5 text-xs text-muted-foreground data-inset:pl-9.5",
				className,
			)}
			{...rest}
		/>
	);
}

export function DropdownMenuItem(
	props: MenuPrimitive.Item.Props & {
		inset?: boolean;
		variant?: "default" | "destructive";
	},
) {
	const { className, inset, variant = "default", ...rest } = props;
	return (
		<MenuPrimitive.Item
			data-slot="dropdown-menu-item"
			data-inset={inset}
			data-variant={variant}
			className={cn(
				"group/dropdown-menu-item relative flex cursor-default items-center gap-2.5 rounded-xl px-3 py-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-9.5 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive",
				className,
			)}
			{...rest}
		/>
	);
}

export function DropdownMenuSub(props: MenuPrimitive.SubmenuRoot.Props) {
	return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />;
}

export function DropdownMenuSubTrigger(
	props: MenuPrimitive.SubmenuTrigger.Props & {
		inset?: boolean;
	},
) {
	const { className, inset, children, ...rest } = props;
	return (
		<MenuPrimitive.SubmenuTrigger
			data-slot="dropdown-menu-sub-trigger"
			data-inset={inset}
			className={cn(
				"flex cursor-default items-center gap-2 rounded-xl px-3 py-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-9.5 data-popup-open:bg-accent data-popup-open:text-accent-foreground data-open:bg-accent data-open:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			{...rest}
		>
			{children}
			<CaretRightIcon className="ml-auto" />
		</MenuPrimitive.SubmenuTrigger>
	);
}

export function DropdownMenuSubContent(
	props: ComponentProps<typeof DropdownMenuContent>,
) {
	return (
		<DropdownMenuContent
			{...props}
			data-slot="dropdown-menu-sub-content"
			className={cn(
				"w-auto min-w-36 rounded-2xl bg-popover p-1 text-popover-foreground shadow-2xl ring-1 ring-foreground/5 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
				props.className,
			)}
			align={props.align ?? "start"}
			alignOffset={props.alignOffset ?? -3}
			side={props.side ?? "right"}
			sideOffset={props.sideOffset ?? 0}
		/>
	);
}

export function DropdownMenuCheckboxItem(
	props: MenuPrimitive.CheckboxItem.Props & {
		inset?: boolean;
	},
) {
	const { className, children, inset, ...rest } = props;
	return (
		<MenuPrimitive.CheckboxItem
			data-slot="dropdown-menu-checkbox-item"
			data-inset={inset}
			className={cn(
				"relative flex cursor-default items-center gap-2.5 rounded-xl py-2 pr-8 pl-3 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-9.5 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			{...rest}
		>
			<span
				className="pointer-events-none absolute right-2 flex items-center justify-center"
				data-slot="dropdown-menu-checkbox-item-indicator"
			>
				<MenuPrimitive.CheckboxItemIndicator>
					<CheckIcon />
				</MenuPrimitive.CheckboxItemIndicator>
			</span>
			{children}
		</MenuPrimitive.CheckboxItem>
	);
}

export function DropdownMenuRadioGroup(props: MenuPrimitive.RadioGroup.Props) {
	return (
		<MenuPrimitive.RadioGroup
			data-slot="dropdown-menu-radio-group"
			{...props}
		/>
	);
}

export function DropdownMenuRadioItem(
	props: MenuPrimitive.RadioItem.Props & {
		inset?: boolean;
	},
) {
	const { className, children, inset, ...rest } = props;
	return (
		<MenuPrimitive.RadioItem
			data-slot="dropdown-menu-radio-item"
			data-inset={inset}
			className={cn(
				"relative flex cursor-default items-center gap-2.5 rounded-xl py-2 pr-8 pl-3 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-9.5 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			{...rest}
		>
			<span
				className="pointer-events-none absolute right-2 flex items-center justify-center"
				data-slot="dropdown-menu-radio-item-indicator"
			>
				<MenuPrimitive.RadioItemIndicator>
					<CheckIcon />
				</MenuPrimitive.RadioItemIndicator>
			</span>
			{children}
		</MenuPrimitive.RadioItem>
	);
}

export function DropdownMenuSeparator(props: MenuPrimitive.Separator.Props) {
	const { className, ...rest } = props;
	return (
		<MenuPrimitive.Separator
			data-slot="dropdown-menu-separator"
			className={cn("-mx-1 my-1 h-px bg-border/50", className)}
			{...rest}
		/>
	);
}

export function DropdownMenuShortcut(props: ComponentProps<"span">) {
	const { className, ...rest } = props;
	return (
		<span
			data-slot="dropdown-menu-shortcut"
			className={cn(
				"ml-auto text-xs tracking-widest text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground",
				className,
			)}
			{...rest}
		/>
	);
}
