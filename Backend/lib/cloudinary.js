import { v2 as cloudinary } from "cloudinary";

export function hasCloudinaryConfig() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
  );
}

if (hasCloudinaryConfig()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadImage(image) {
  if (!image) return "";

  // Already-hosted URL can be reused as-is.
  if (typeof image === "string" && image.startsWith("http")) {
    return image;
  }

  if (!hasCloudinaryConfig()) {
    throw new Error(
      "Cloudinary is not configured. Add env keys to enable image uploads.",
    );
  }

  const result = await cloudinary.uploader.upload(image);
  return result.secure_url;
}
