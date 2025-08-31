import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage engine
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    // You can also organize files into folders (images/videos)
    let subDir = "others";
    if (file.mimetype.startsWith("image/")) subDir = "images";
    else if (file.mimetype.startsWith("video/")) subDir = "videos";

    const finalPath = path.join(uploadDir, subDir);
    if (!fs.existsSync(finalPath)) fs.mkdirSync(finalPath, { recursive: true });

    cb(null, finalPath);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    const uniqueName = `${Date.now()}-${baseName}${ext}`;
    cb(null, uniqueName);
  },
});

// Allowed file types
const fileFilter = (_req, file, cb) => {
  const allowedMime = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
  ];
  if (!allowedMime.includes(file.mimetype)) {
    return cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
  cb(null, true);
};

// Multer upload instance
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter,
});

export default upload;
