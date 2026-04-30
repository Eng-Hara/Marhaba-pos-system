const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Check if Cloudinary is configured (avoid "Unknown API key" crash)
const isCloudinaryConfigured = () => {
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const placeholders = ['your_api_key', 'your_api_secret', 'your_cloud_name', '', undefined];
  return key && secret && name && !placeholders.includes(key) && !placeholders.includes(secret) && !placeholders.includes(name);
};

let storage;
let cloudinaryConfigured = false;

if (isCloudinaryConfigured()) {
  cloudinaryConfigured = true;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'clothes-pos/products',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto:good' }
      ],
      public_id: (req, file) => {
        const timestamp = Date.now();
        const originalname = file.originalname.split('.')[0];
        return `product_${timestamp}_${originalname}`;
      }
    }
  });
} else {
  // Use memory storage so uploads don't call Cloudinary and crash the server
  storage = multer.memoryStorage();
  if (process.env.NODE_ENV !== 'test') {
    console.warn('Cloudinary not configured (missing or placeholder env). Image uploads will use default placeholder.');
  }
}

// File filter
const fileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|webp|WEBP|gif|GIF)$/)) {
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = { cloudinary, upload, isCloudinaryConfigured: () => cloudinaryConfigured };