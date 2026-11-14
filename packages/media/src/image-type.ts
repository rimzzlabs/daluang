import { A, O, pipe } from "@mobily/ts-belt";

/** The image types of the CMS. SVG is not one of them: it can hold a script. */
export const IMAGE_TYPES = {
	png: { contentType: "image/png", extension: "png" },
	jpeg: { contentType: "image/jpeg", extension: "jpg" },
	webp: { contentType: "image/webp", extension: "webp" },
	gif: { contentType: "image/gif", extension: "gif" },
	avif: { contentType: "image/avif", extension: "avif" },
} as const;

export type ImageType = keyof typeof IMAGE_TYPES;

const AVIF_BRANDS = ["avif", "avis"];

// The first brand is at byte 16. A file with more than 32 brands is not an image of a
// camera or an encoder, and the limit keeps the cost fixed.
const BRANDS_MAX = 32;

// One character for each byte. `subarray` stops at the end of the array, so a short
// input gives a short text and never an error.
function readText(bytes: Uint8Array, offset: number, length: number): string {
	return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function hasText(bytes: Uint8Array, offset: number, text: string): boolean {
	return readText(bytes, offset, text.length) === text;
}

function isPng(bytes: Uint8Array): boolean {
	return hasText(bytes, 0, "\x89PNG\r\n\x1a\n");
}

function isJpeg(bytes: Uint8Array): boolean {
	return hasText(bytes, 0, "\xFF\xD8\xFF");
}

function isGif(bytes: Uint8Array): boolean {
	return hasText(bytes, 0, "GIF87a") || hasText(bytes, 0, "GIF89a");
}

function isWebp(bytes: Uint8Array): boolean {
	return hasText(bytes, 0, "RIFF") && hasText(bytes, 8, "WEBP");
}

function isAvif(bytes: Uint8Array): boolean {
	if (bytes.length < 12 || !hasText(bytes, 4, "ftyp")) return false;
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	// The box size can lie. The end is never past the array.
	const end = Math.min(view.getUint32(0), bytes.length);
	const compatibleBrands = pipe(
		A.makeWithIndex(BRANDS_MAX, (index) => 16 + index * 4),
		A.filter((offset) => offset + 4 <= end),
		A.map((offset) => readText(bytes, offset, 4)),
	);
	return A.some([readText(bytes, 8, 4), ...compatibleBrands], (brand) =>
		A.includes(AVIF_BRANDS, brand),
	);
}

const DETECTORS: Array<[ImageType, (bytes: Uint8Array) => boolean]> = [
	["png", isPng],
	["jpeg", isJpeg],
	["gif", isGif],
	["webp", isWebp],
	["avif", isAvif],
];

/**
 * The type of an image, read from the first bytes. The name of the file and the headers
 * of a request are not evidence: a person controls them. Gives `null` for any other input.
 */
export function imageType(bytes: Uint8Array): ImageType | null {
	return pipe(
		DETECTORS,
		A.getBy(([, matches]) => matches(bytes)),
		O.map(([type]) => type),
		O.toNullable,
	);
}
