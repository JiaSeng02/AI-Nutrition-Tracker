export interface CapturedImageData {
  base64: string;
  mimeType: string;
}

type GlobalWithImageStore = typeof globalThis & {
  __AI_NUTRITION_CAPTURED_IMAGES__?: Map<string, CapturedImageData>;
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
  mimeType = "image/jpeg",
): void {
  capturedImages.set(uri, { base64, mimeType });
}

export function getCapturedImage(uri: string): CapturedImageData | null {
  return capturedImages.get(uri) ?? null;
}

export function loadCapturedImage(uri: string): CapturedImageData {
  const cached = getCapturedImage(uri);

  if (cached?.base64) {
    return cached;
  }

  throw new Error(
    "The selected image data is no longer available. Please choose the photo again.",
  );
}
