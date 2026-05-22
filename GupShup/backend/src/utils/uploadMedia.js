import { cloudinary, isCloudinaryConfigured } from "../config/cloudinary.js";

export async function uploadMediaIfNeeded(mediaUrl, mediaType, folder) {
  const value = String(mediaUrl || "");
  if (!value) return "";
  if (!value.startsWith("data:") || !isCloudinaryConfigured) {
    return value;
  }

  const resourceType = mediaType === "video" ? "video" : "image";
  const result = await cloudinary.uploader.upload(value, {
    folder,
    resource_type: resourceType,
  });
  return result.secure_url;
}
