// import path from "path";
// import fs from "fs";
// import multer from "multer";

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadPath = path.join(process.cwd(), "public", "uploads", "tasks");
//     fs.mkdirSync(uploadPath, { recursive: true });
//     cb(null, uploadPath);
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname);
//     cb(null, `${Date.now()}-${file.fieldname}${ext}`);
//   }
// });

// export const uploadTaskImages = multer({ storage }).array("images", 10);
