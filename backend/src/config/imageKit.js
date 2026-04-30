const ImageKit = require("imagekit");
const multer = require("multer");

// Check if ImageKit configured
const isImageKitConfigured = () => {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  const placeholders = [
    "your_public_key",
    "your_private_key",
    "your_url_endpoint",
    "",
    undefined,
  ];

  return (
    publicKey &&
    privateKey &&
    urlEndpoint &&
    !placeholders.includes(publicKey) &&
    !placeholders.includes(privateKey) &&
    !placeholders.includes(urlEndpoint)
  );
};

let imagekit = null;
let imagekitConfigured = false;

if (isImageKitConfigured()) {
  imagekitConfigured = true;

  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
} else {
  console.warn(
    "ImageKit not configured. Uploads will fail until env variables are set."
  );
}

// Multer memory storage (file wuxuu ku jiraa RAM)
const storage = multer.memoryStorage();

// File filter (same as Cloudinary)
const fileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
    req.fileValidationError = "Only image files are allowed!";
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Function upload image to ImageKit
const uploadToImageKit = async (file) => {
  if (!imagekitConfigured) throw new Error("ImageKit not configured");

  const fileName = `product_${Date.now()}_${file.originalname}`;

  const result = await imagekit.upload({
    file: file.buffer, // multer buffer
    fileName: fileName,
    folder: "/clothes-pos/products",
    useUniqueFileName: true,
  });

  return result.url; // muhiim: URL-ka sawirka
};

module.exports = {
  upload,
  uploadToImageKit,
  imagekitConfigured: () => imagekitConfigured,
};