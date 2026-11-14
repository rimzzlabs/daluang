import { describe, expect, it } from "vitest";
import { IMAGE_TYPES, type ImageType, imageType } from "../src/image-type";

function ascii(text: string): number[] {
	return Array.from(text, (char) => char.charCodeAt(0));
}

function uint32(value: number): number[] {
	return [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
}

function bytesOf(...parts: number[][]): Uint8Array {
	return Uint8Array.from(parts.flat());
}

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

// A `ftyp` box: the size, the major brand, the minor version, and the compatible brands.
function ftypBox(major: string, compatible: string[], size?: number): number[] {
	const brands = compatible.flatMap(ascii);
	return [
		...uint32(size ?? 16 + brands.length),
		...ascii("ftyp"),
		...ascii(major),
		...uint32(0),
		...brands,
	];
}

function ftyp(major: string, compatible: string[], size?: number): Uint8Array {
	return bytesOf(ftypBox(major, compatible, size));
}

describe("imageType", () => {
	it("reads a PNG", () => {
		expect(imageType(bytesOf(PNG, [0, 0, 0, 13]))).toBe("png");
	});

	it("reads a JPEG", () => {
		expect(imageType(bytesOf([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpeg");
	});

	it("reads a GIF of each version", () => {
		expect(imageType(bytesOf(ascii("GIF87a"), [1, 0]))).toBe("gif");
		expect(imageType(bytesOf(ascii("GIF89a"), [1, 0]))).toBe("gif");
		expect(imageType(bytesOf(ascii("GIF88a")))).toBeNull();
	});

	it("reads a WebP", () => {
		const head = bytesOf(
			ascii("RIFF"),
			uint32(0),
			ascii("WEBP"),
			ascii("VP8 "),
		);
		expect(imageType(head)).toBe("webp");
	});

	it("refuses a RIFF file that is not a WebP", () => {
		const wave = bytesOf(ascii("RIFF"), uint32(0), ascii("WAVE"));
		expect(imageType(wave)).toBeNull();
	});

	it("reads an AVIF by its major brand", () => {
		expect(imageType(ftyp("avif", ["mif1"]))).toBe("avif");
	});

	it("reads an AVIF of an image sequence by the brand avis", () => {
		expect(imageType(ftyp("avis", []))).toBe("avif");
	});

	it("reads an AVIF by a compatible brand only", () => {
		expect(imageType(ftyp("mif1", ["miaf", "avif"]))).toBe("avif");
	});

	it("refuses a HEIC file, which has no AVIF brand", () => {
		expect(imageType(ftyp("heic", ["mif1", "heic"]))).toBeNull();
	});

	it("reads a brand only inside the box", () => {
		// The box has 16 bytes, so the brand `avif` after it is outside the box.
		const outside = bytesOf(ftypBox("heic", []), ascii("avif"));
		expect(imageType(outside)).toBeNull();
	});

	it("reads a brand that ends at the end of the box", () => {
		expect(imageType(ftyp("heic", ["mif1", "avif"]))).toBe("avif");
	});

	it("reads at most 32 compatible brands", () => {
		const filler = Array.from({ length: 32 }, () => "mif1");
		expect(imageType(ftyp("heic", [...filler, "avif"]))).toBeNull();
		expect(imageType(ftyp("heic", [...filler.slice(1), "avif"]))).toBe("avif");
	});

	it("does not throw when the box size points past the array", () => {
		expect(imageType(ftyp("heic", ["mif1"], 4_000_000_000))).toBeNull();
		expect(imageType(ftyp("heic", ["mif1", "avif"], 4_000_000_000))).toBe(
			"avif",
		);
	});

	it("reads the major brand when the box size is below 16", () => {
		expect(imageType(ftyp("avif", ["avif"], 8))).toBe("avif");
		expect(imageType(ftyp("heic", ["avif"], 8))).toBeNull();
		expect(imageType(ftyp("heic", ["avif"], 0))).toBeNull();
	});

	it("reads an AVIF in a view of a larger buffer", () => {
		// The brand is only in the compatible brands, so the result needs the box size.
		// A read of the size at byte 0 of the buffer gives 0, and then `null`.
		const buffer = bytesOf([0, 0, 0], ftypBox("heic", ["avif"]), [9, 9]);
		expect(imageType(buffer.subarray(3, 3 + 20))).toBe("avif");
	});

	it.each([
		["an empty array", bytesOf()],
		["one byte", bytesOf([0x89])],
		["a truncated PNG", bytesOf(PNG.slice(0, 4))],
		["a PNG that lacks its last byte", bytesOf(PNG.slice(0, 7))],
		["a truncated JPEG", bytesOf([0xff, 0xd8])],
		["a truncated GIF", bytesOf(ascii("GIF89"))],
		["RIFF with no WEBP", bytesOf(ascii("RIFF"), uint32(0))],
		["WEBP with a short RIFF head", bytesOf(ascii("RIFF"), uint32(0), [87])],
		["an ftyp box cut after the type", bytesOf(uint32(24), ascii("ftyp"))],
		[
			"an ftyp box cut in the major brand",
			bytesOf(ftypBox("avif", []).slice(0, 11)),
		],
	])("gives null for %s", (_name, bytes) => {
		expect(imageType(bytes)).toBeNull();
	});

	it.each([
		["SVG", `<svg xmlns="http://www.w3.org/2000/svg"></svg>`],
		["XML", `<?xml version="1.0"?><svg></svg>`],
		["HTML", "<!doctype html><html></html>"],
		["a PDF", "%PDF-1.7\n"],
		["a text file", "hello, this is a note"],
	])("gives null for %s", (_name, text) => {
		expect(imageType(Uint8Array.from(ascii(text)))).toBeNull();
	});

	it("gives null for a name that looks like an image", () => {
		expect(imageType(Uint8Array.from(ascii("image.png")))).toBeNull();
	});

	it("does not change its input", () => {
		const input = ftyp("mif1", ["avif"]);
		const copy = Uint8Array.from(input);
		imageType(input);
		expect(input).toEqual(copy);
	});
});

describe("IMAGE_TYPES", () => {
	it.each([
		["png", "image/png", "png"],
		["jpeg", "image/jpeg", "jpg"],
		["webp", "image/webp", "webp"],
		["gif", "image/gif", "gif"],
		["avif", "image/avif", "avif"],
	] satisfies Array<[ImageType, string, string]>)(
		"gives the content type and the extension of %s",
		(type, contentType, extension) => {
			expect(IMAGE_TYPES[type]).toEqual({ contentType, extension });
		},
	);

	it("holds the five types and no other", () => {
		expect(Object.keys(IMAGE_TYPES)).toHaveLength(5);
	});
});
