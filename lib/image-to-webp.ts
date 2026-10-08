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
  const image = await decode(file);
  return image
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

/** Open Graph / LinkedIn share-card size (LinkedIn's 1200 × 627 crops this by 3 px). */
export const SHARE_CARD = { width: 1200, height: 630 } as const;

/**
 * Turns a listing photo into a share card: exactly 1200 × 630, cropped
 * around the most interesting area (sharp's "attention" strategy) rather than
 * the centre, and compressed harder than gallery photos since previews are
 * small — typically ~60–150 KB.
 */
export async function imageToShareCard(file: File): Promise<Buffer> {
  // Flatten EXIF rotation first so the size read below matches what's displayed.
  const image = sharp(await (await decode(file)).toBuffer());
  const { width = SHARE_CARD.width, height = SHARE_CARD.height } = await image.metadata();
  // Never upscale: a photo smaller than the card is cropped to the card's
  // 1.91:1 ratio at its own resolution instead of being blown up and blurred.
  const scale = Math.min(1, width / SHARE_CARD.width, height / SHARE_CARD.height);
  return image
    .resize({
      width: Math.round(SHARE_CARD.width * scale),
      height: Math.round(SHARE_CARD.height * scale),
      fit: "cover",
      position: sharp.strategy.attention,
    })
    .webp({ quality: 78 })
    .toBuffer();
}

/** Side, in pixels, of the square profile avatar. */
export const AVATAR_SIZE = 512;

/** Crops a profile photo to a 512 × 512 square around its most interesting area. */
export async function imageToAvatar(file: File): Promise<Buffer> {
  const image = await decode(file);
  return image
    .resize({ width: AVATAR_SIZE, height: AVATAR_SIZE, fit: "cover", position: sharp.strategy.attention })
    .webp({ quality: 80 })
    .toBuffer();
}

/** A sharp pipeline for the photo, decoding iPhone HEIC first and applying EXIF rotation. */
async function decode(file: File) {
  const input = Buffer.from(await file.arrayBuffer());
  return isHeic(file)
    ? decodeHeic({ buffer: input }).then(({ width, height, data }) =>
        sharp(Buffer.from(data.buffer, data.byteOffset, data.byteLength), {
          raw: { width, height, channels: 4 },
        }),
      )
    : sharp(input).rotate(); // apply EXIF orientation (phone photos)
}
