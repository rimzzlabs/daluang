# Media

This page tells how the CMS knows the type of an image. The logic is in `packages/media`.
The plan for the images is in "Images: the plan" of `AGENTS.md`. This page tells only what
the code does now. The plan holds the stages that have no code yet.

- `imageType` of `packages/media/src/image-type.ts` reads the type of an image from its
  first bytes. It does not read the name of the file or a header, because a person
  controls both. It is a pure function. It does not throw, and it does not change its
  input.
- `IMAGE_TYPES` has the content type and the file extension of each type. The key is the
  name of the type. `ImageType` is the union of the keys.

| Type   | Content type | Extension | Bytes that the function reads                                        |
| ------ | ------------ | --------- | -------------------------------------------------------------------- |
| `png`  | `image/png`  | `png`     | `89 50 4E 47 0D 0A 1A 0A`                                            |
| `jpeg` | `image/jpeg` | `jpg`     | `FF D8 FF`                                                           |
| `gif`  | `image/gif`  | `gif`     | `GIF87a` or `GIF89a`                                                 |
| `webp` | `image/webp` | `webp`    | `RIFF` at byte 0 and `WEBP` at byte 8                                |
| `avif` | `image/avif` | `avif`    | `ftyp` at byte 4, and the brand `avif` or `avis` (see the next list) |

- An AVIF file starts with an `ftyp` box. The brand is the major brand (4 bytes at byte 8) or one of the compatible brands. The compatible brands start at byte 16 and end at
  the end of the box. The first 4 bytes of the box give its size.
- The function reads the first 32 compatible brands at most. It never reads a byte past
  the end of the array. It reads a compatible brand only in the box, and it always reads
  the major brand. If the box size is below 16, only the major brand counts. If the box
  size is past the end of the array, the array ends the box.
- A box size of 0 (the box runs to the end of the file) or of 1 (a size of 64 bits) is
  below 16. An AVIF file with such a box and no major brand `avif` or `avis` gives
  `null`. The usual encoders do not write such a box.
- `imageType` gives `null` for each other input: an empty or short array, SVG, HTML, a
  PDF, and a text file. A HEIC file also gives `null`, because its brands are not `avif`
  or `avis`. SVG is not a type, because it can hold a script.
