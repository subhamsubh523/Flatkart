import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

// Use memory storage — upload to Cloudinary manually in route handlers
const storage = multer.memoryStorage();
export const upload = multer({ storage });
export const uploadAvatar = multer({ storage });

export const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const stream = cloudinary.uploader.upload_stream(
      { folder, allowed_formats: ["jpg", "jpeg", "png", "webp"], transformation: [{ quality: "auto", fetch_format: "auto" }] },
      (err, result) => err ? reject(err) : resolve(result)
    );
    stream.end(buffer);
  });

export const uploadAvatarToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const stream = cloudinary.uploader.upload_stream(
      { folder: "flatkart/avatars", transformation: [{ width: 300, height: 300, crop: "fill", gravity: "face" }] },
      (err, result) => err ? reject(err) : resolve(result)
    );
    stream.end(buffer);
  });

export const destroyFromCloudinary = (publicId) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary.uploader.destroy(publicId).catch(() => {});
};

export default upload;
