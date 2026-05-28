import heic2any from "heic2any";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 1600;
const MIN_VALID_SIZE = 10_000;

async function convertHeic(file: File): Promise<File> {
  const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
  const result = Array.isArray(blob) ? blob[0] : blob;
  return new File([result], file.name.replace(/\.heic$/i, ".jpg"), { type: "image/jpeg" });
}

function compressViaCanvas(bitmap: ImageBitmap, width: number, height: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("Canvas 2D context not available"));
    ctx.drawImage(bitmap, 0, 0, width, height);
    canvas.toBlob(
      (blob) => { if (blob) resolve(blob); else reject(new Error("Canvas toBlob returned null")); },
      "image/jpeg",
      quality
    );
  });
}

export async function compressImage(file: File, filename: string): Promise<File> {
  // Convert HEIC/HEIF (iPhone photos) to JPEG first
  if (file.type === "image/heic" || file.type === "image/heif" || /\.heic$/i.test(file.name)) {
    file = await convertHeic(file);
  }

  if (file.size <= MAX_SIZE_BYTES) {
    return new File([file], filename, { type: file.type || "image/jpeg" });
  }

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  let blob: Blob;
  try {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, width, height);
    blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.82 });
    if (blob.size < MIN_VALID_SIZE) blob = await compressViaCanvas(bitmap, width, height, 0.82);
  } catch {
    blob = await compressViaCanvas(bitmap, width, height, 0.82);
  }

  bitmap.close();

  if (blob.size > MAX_SIZE_BYTES) {
    const bitmap2 = await createImageBitmap(file);
    try { blob = await compressViaCanvas(bitmap2, width, height, 0.6); }
    finally { bitmap2.close(); }
  }

  if (blob.size < MIN_VALID_SIZE) {
    throw new Error(`Compression produced a ${(blob.size / 1024).toFixed(1)}KB file — try a different format.`);
  }

  return new File([blob], filename, { type: "image/jpeg" });
}
