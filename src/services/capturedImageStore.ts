export interface CapturedImageData {
  base64: string;
  mimeType: string;
  uri?: string;
  timestamp?: number;
}

type GlobalWithImageStore = typeof globalThis & {
  __AI_NUTRITION_CAPTURED_IMAGES__?: Map<string, CapturedImageData>;
  __AI_NUTRITION_LATEST_IMAGE__?: CapturedImageData;
};

const globalObject = globalThis as GlobalWithImageStore;

const capturedImages =
  globalObject.__AI_NUTRITION_CAPTURED_IMAGES__ ??
  (globalObject.__AI_NUTRITION_CAPTURED_IMAGES__ = new Map<
    string,
    CapturedImageData
  >());

export function storeCapturedImage(
  uri: string,
  base64: string,
  mimeType: string = "image/jpeg",
): void {
  // Strip any data: URI prefix from the base64 string if present
  const cleanBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
  const data: CapturedImageData = {
    base64: cleanBase64,
    mimeType: mimeType || "image/jpeg",
    uri,
    timestamp: Date.now(),
  };

  capturedImages.set(uri, data);

  // Store common normalized variations to withstand URI serialization differences across navigation
  try {
    const decoded = decodeURIComponent(uri);
    if (decoded !== uri) {
      capturedImages.set(decoded, data);
    }
  } catch {
    // Ignore URI decode errors
  }

  try {
    const encoded = encodeURI(uri);
    if (encoded !== uri) {
      capturedImages.set(encoded, data);
    }
  } catch {
    // Ignore URI encode errors
  }

  globalObject.__AI_NUTRITION_LATEST_IMAGE__ = data;
}

export function getCapturedImage(
  uri?: string | string[] | null,
): CapturedImageData | null {
  if (!uri) {
    return globalObject.__AI_NUTRITION_LATEST_IMAGE__ ?? null;
  }

  const cleanUri = Array.isArray(uri) ? uri[0] : uri;
  if (!cleanUri || typeof cleanUri !== "string") {
    return globalObject.__AI_NUTRITION_LATEST_IMAGE__ ?? null;
  }

  // 1. Direct map lookup
  if (capturedImages.has(cleanUri)) {
    return capturedImages.get(cleanUri)!;
  }

  // 2. Decoded URI lookup
  try {
    const decoded = decodeURIComponent(cleanUri);
    if (capturedImages.has(decoded)) {
      return capturedImages.get(decoded)!;
    }
  } catch {
    // Ignore
  }

  // 3. Encoded URI lookup
  try {
    const encoded = encodeURI(cleanUri);
    if (capturedImages.has(encoded)) {
      return capturedImages.get(encoded)!;
    }
  } catch {
    // Ignore
  }

  // A requested URI must resolve to that exact image. Falling back to the most
  // recently captured photo here can attach another food's photo to this entry.
  return null;
}

export async function loadCapturedImage(
  uri?: string | string[] | null,
): Promise<CapturedImageData> {
  const cached = getCapturedImage(uri);
  if (cached?.base64) {
    return cached;
  }

  // Fallback: If uri is a local file:// URI, check if it can be safely read
  const cleanUri = Array.isArray(uri) ? uri[0] : uri;
  if (cleanUri && typeof cleanUri === "string" && cleanUri.startsWith("file://")) {
    try {
      const { File } = await import("expo-file-system");
      const file = new File(cleanUri);
      if (file.exists) {
        const base64 = await file.base64();
        if (base64) {
          const extension = cleanUri.split(".").pop()?.toLowerCase();
          const mimeType =
            extension === "png"
              ? "image/png"
              : extension === "webp"
              ? "image/webp"
              : "image/jpeg";
          const data = {
            base64,
            mimeType,
            uri: cleanUri,
            timestamp: Date.now(),
          };
          storeCapturedImage(cleanUri, base64, mimeType);
          return data;
        }
      }
    } catch {
      // Safe fallback failed; continue to clear error message
    }
  }

  throw new Error(
    "The selected image is no longer available. Please retake or choose the photo again.",
  );
}

export function clearCapturedImage(uri?: string): void {
  if (uri) {
    capturedImages.delete(uri);
    try {
      capturedImages.delete(decodeURIComponent(uri));
    } catch {}
    try {
      capturedImages.delete(encodeURI(uri));
    } catch {}
  }

  if (!uri || globalObject.__AI_NUTRITION_LATEST_IMAGE__?.uri === uri) {
    globalObject.__AI_NUTRITION_LATEST_IMAGE__ = undefined;
  }
}
