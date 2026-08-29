/**
 * Validate that a value is a valid Base64 data URI or null.
 * Enforces: type check, data:image/ prefix, supported formats (webp/png/jpeg),
 * and max length of 50,000 characters (~36.6 KB decoded).
 *
 * Shared by every feature that stores a user-uploaded image as a Base64 data
 * URI (product images, the WhatsApp offer template image, ...). Callers that
 * trust this validation at write time should not re-encode to verify at read
 * time — re-encoding rejects valid images with minor encoding variations
 * (e.g. trailing newlines).
 */
export function validateImageUrl(imageUrl: unknown): { valid: boolean; error?: string } {
  if (imageUrl === null || imageUrl === undefined) {
    return { valid: true }; // null means "clear the image"
  }
  if (typeof imageUrl !== 'string') {
    return { valid: false, error: 'image_url must be a string or null' };
  }
  if (!imageUrl.startsWith('data:image/')) {
    return { valid: false, error: 'image_url must be a Base64 data URI' };
  }
  const formatMatch = imageUrl.match(/^data:image\/(webp|png|jpeg|jpg);base64,/);
  if (!formatMatch) {
    return { valid: false, error: 'Invalid image format. Supported: webp, png, jpeg' };
  }
  if (imageUrl.length > 50_000) {
    return { valid: false, error: 'Image too large (max 50,000 characters)' };
  }
  return { valid: true };
}

/** Parsed pieces of a validated `data:image/...;base64,...` URI. */
export interface ParsedDataUriImage {
  mimetype: string;
  buffer: Buffer;
}

/**
 * Decode an already-validated data URI into a Buffer + mimetype, e.g. for
 * handing to a downstream sender (WhatsApp) or storage layer. Returns null
 * if the string isn't a well-formed `data:image/...;base64,...` URI.
 */
export function parseDataUriImage(imageUrl: string): ParsedDataUriImage | null {
  const match = imageUrl.match(/^data:(image\/(?:webp|png|jpeg|jpg));base64,(.+)$/);
  if (!match) return null;
  return { mimetype: match[1], buffer: Buffer.from(match[2], 'base64') };
}
