/**
 * imageStorage.ts
 *
 * Utilities for persistently storing food photos in the app's document directory.
 * Photos taken by the camera or picked from the gallery are initially stored in
 * ephemeral cache/content URIs that become invalid after the session or when the
 * OS reclaims them. This module copies them to a stable location.
 */

import { Directory, File, Paths } from "expo-file-system";
import { getCapturedImage, storeCapturedImage } from "./capturedImageStore";

const FOOD_PHOTOS_DIR = new Directory(Paths.document, "food_photos");

function createPhotoName(extension: string): string {
  const uniqueId = Math.random().toString(36).slice(2, 9);
  return `food_${Date.now()}_${uniqueId}.${extension}`;
}

/** Ensure the food_photos directory exists. */
function ensureDir(): void {
  if (!FOOD_PHOTOS_DIR.exists) {
    FOOD_PHOTOS_DIR.create({ intermediates: true, idempotent: true });
  }
}

/**
 * Returns true if the given URI already lives inside our persistent photos dir.
 */
export function isPersistentUri(uri: string): boolean {
  return uri.startsWith(FOOD_PHOTOS_DIR.uri);
}

/**
 * Copies a photo from a transient URI (camera cache, content://, etc.) to the
 * app's persistent document directory and returns the new permanent file:// URI.
 *
 * If the URI is already persistent, returns it unchanged.
 * Falls back gracefully and returns the original URI on any error.
 */
export async function persistPhoto(sourceUri: string): Promise<string> {
  if (!sourceUri) return sourceUri;

  // Already in our persistent dir — nothing to do
  if (isPersistentUri(sourceUri)) return sourceUri;

  try {
    ensureDir();

    const ext = sourceUri.split(".").pop()?.toLowerCase() ?? "jpg";
    const safeName = createPhotoName(ext);
    const destFile = new File(FOOD_PHOTOS_DIR, safeName);

    await new File(sourceUri).copy(destFile);
    return destFile.uri;
  } catch {
    // Picker cache/content URIs may no longer be readable. Use the base64 captured
    // with the image when available so the persistent copy can still be created.
    const captured = getCapturedImage(sourceUri);
    if (captured?.base64) {
      try {
        return await persistPhotoFromBase64(captured.base64, captured.mimeType);
      } catch {
        return sourceUri;
      }
    }

    // Some Android picker URIs do not grant direct filesystem read access. Keep
    // the original URI as a last resort without treating that expected case as
    // an application warning.
    return sourceUri;
  }
}

/**
 * Writes a base64 string as an image to the persistent photo directory.
 * Returns the permanent file:// URI.
 */
export async function persistPhotoFromBase64(
  base64: string,
  mimeType: string = "image/jpeg",
): Promise<string> {
  ensureDir();
  const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
  const safeName = createPhotoName(ext);
  const destFile = new File(FOOD_PHOTOS_DIR, safeName);
  // Strip data URI prefix if present
  const cleanBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
  if (!cleanBase64) {
    throw new Error("No image data was provided for persistence.");
  }
  destFile.create({ intermediates: true, overwrite: true });
  destFile.write(cleanBase64, { encoding: "base64" });
  if (!destFile.exists || !destFile.size) {
    throw new Error("The photo could not be written to app storage.");
  }
  // Keep the exact photo associated with its stable URI for an in-memory
  // display fallback if the native image loader cannot open the file.
  storeCapturedImage(destFile.uri, cleanBase64, mimeType);
  return destFile.uri;
}
