import decodeHeic from "heic-decode";
import sharp from "sharp";

/** Longest side, in pixels, that uploaded property photos are resized down to. */
const MAX_DIMENSION = 2560;
const WEBP_QUALITY = 82;

function isHeic(file: File) {
  const type = file.type.toLowerCase();
  return type === "image/heic" || type === "image/heif" || /\.hei[cf]$/i.test(file.name);
}

/**
 * Converts an uploaded JPG/JPEG/PNG/HEIC photo to WebP. The prebuilt `sharp`
 * binaries can't decode iPhone HEIC (HEVC), so those go through `heic-decode`
 * first and are handed to `sharp` as raw RGBA pixels.
 */
export async function imageToWebp(file: File): Promise<Buffer> {
  const input = Buffer.from(await file.arrayBuffer());

  const image = isHeic(file)
    ? await decodeHeic({ buffer: input }).then(({ width, height, data }) =>
        sharp(Buffer.from(data.buffer, data.byteOffset, data.byteLength), {
          raw: { width, height, channels: 4 },
        }),
      )
    : sharp(input).rotate(); // apply EXIF orientation (phone photos)

  return image
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}
