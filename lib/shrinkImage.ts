export const MAX_MB = 1;
export const MAX_BYTES = MAX_MB * 1024 * 1024; // matches the bucket limit
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function shrinkImage(file: File, maxDim = 1080, quality = 0.8): Promise<File> {
  if (file.type === "image/gif") return file; // keep GIF animation

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  if (!blob || blob.size >= file.size) return file;

  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}