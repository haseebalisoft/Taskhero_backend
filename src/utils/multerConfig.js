import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Base upload folder
const baseUploadDir = path.join(process.cwd(), 'public/uploads');

// Ensure folder exists
const ensureDirExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Default folder for all uploads (can be changed per route)
    const folder = req.uploadFolder || 'profile';
    const uploadPath = path.join(baseUploadDir, folder);
    ensureDirExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext)
      .replace(/\s+/g, '_')
      .toLowerCase();
    const filename = `${baseName}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

// File filter (only images for now)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max per file
});
