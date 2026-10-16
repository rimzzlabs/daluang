import type { SVGProps } from "react";

// The outline of the Sundanese letter da, on the 256 grid of `assets/daluang-mark.svg`.
const MARK_PATH =
	"M161.77 68.00 L123.47 68.00 L85.78 184.00 L132.25 184.00 L155.46 112.56 L174.35 112.56 L206.01 210.00 L178.67 210.00 L164.90 167.63 L151.14 210.00 L49.99 210.00 L104.58 42.00 L170.22 42.00 Z";

export type DaluangMarkProps = Omit<
	SVGProps<SVGSVGElement>,
	"children" | "viewBox"
>;

/**
 * The mark of Daluang: the Sundanese letter da (ᮓ). The view box has no margin, so the
 * height of the element is the height of the letter. The mark takes the text colour.
 */
export function DaluangMark(props: DaluangMarkProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="50 42 156 168"
			fill="currentColor"
			aria-hidden="true"
			focusable="false"
			{...props}
		>
			<path d={MARK_PATH} />
		</svg>
	);
}
