import multer from "multer";
import path from "path";
import fs from "fs";

// Reusable storage generator
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = "general";

    if (file.fieldname === "serviceImages") {
      folder = "ServiceImages";
    } else if (file.fieldname === "ingredientReceipt") {
      folder = "IngredientReceipts";
    } else if(file.fieldname === "Gigdoc"){
      folder="Gigdoc"
    } else if(file.fieldname === "driverImage"){
      folder="driver"
    }else if(file.fieldname==="documents"){
      folder="herodocuments"
    }else if(file.fieldname === "profile_picture"){
      folder="hero"
    }else if(file.fieldname === "images"){
      folder="task"
    }else if(file.fieldname==="vehicleImages"){
      folder="vehicleImages"
    }else if (file.fieldname==="RightToWork" || file.fieldname==="identityCard" || file.fieldname==="drivingLicense" || file.fieldname==="vehicleLicense"|| file.fieldname==="insurranceDcouments"){
        folder="vehicleDocuments"
    }

    const uploadPath = path.join(process.cwd(), "public", "uploads", folder);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  }
});

// 🟡 This defines two keywords: `serviceImages` and `ingredientReceipt`
export const serviceUpload = multer({ storage }).fields([
  {name: "serviceImages", maxCount: 5 },
  {name: "ingredientReceipt", maxCount: 1 },
  {name: "Gigdoc", maxCount: 5 },
  {name:"driverImage",maxCount:1},
  {name:"documents",maxCount:10},
  {name:"profile_picture",maxCount:1},
  {name:"images",maxCount:10},
  {name:"vehicleImages",maxCount:5},
  {name:"RightToWork",maxCount:1},
  {name:"identityCard",maxCount:1},
  {name:"drivingLicense",maxCount:1},
  {name:"vehicleLicense",maxCount:1},
  {name:"insurranceDcouments",maxCount:1},

]);

