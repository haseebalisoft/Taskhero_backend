// controllers/hero.controller.js
import mongoose from "mongoose";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import Hero from "../../models/Hero.js";
import { Service } from "../../models/servicemodel.js";
import { Order } from "../../models/Order.js";
import { Review } from "../../models/Review.js";
import { User } from "../../models/usersmodel.js";
import { Category } from "../../models/categorymodel.js";
import bcrypt from "bcryptjs";

async function uploadToS3(file) {
  return `/uploads/profile/${file.filename || file.originalname}`;
}

// ================== PROFILE ===================

// POST /api/hero/profile - Create or update hero profile
export const createOrUpdateHeroProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const {
    companyName,
    about,
    languages,
    servicetype,
    contactNumber,
    location,
    paymentMethods
  } = req.body;

  // normalize helpers
  const normalizeArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    if (typeof val === "string") return val.split(",").map(s => s.trim()).filter(Boolean);
    return [];
  };

  const langs = normalizeArray(languages);
  const services = normalizeArray(servicetype);
  const payMethods = normalizeArray(paymentMethods);

  const locationObj =
    typeof location === "string" ? JSON.parse(location) : location || {};

  // profile picture upload
  let profilePictureUrl;
  if (req.file) {
    profilePictureUrl = await uploadToS3(req.file);
  }

  const heroUpdate = {
    companyName,
    about,
    languages: langs,
    service_types: services,
    contact: { phone_number: contactNumber },
    location: {
      type: "Point",
      coordinates: locationObj.coordinates || [],
    },
    paymentMethods: payMethods,
  };
  if (profilePictureUrl) heroUpdate.profile_picture = profilePictureUrl;

  const hero = await Hero.findOneAndUpdate(
    { user: userId },
    { $set: heroUpdate, $setOnInsert: { user: userId } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // --- RESPONSE JSON ---
  return res.status(200).json(
    new ApiResponse(200,
      {
        hero_id: hero._id,
        profile_picture: hero.profile_picture || "",
        companyName: hero.companyName || "",
        about: hero.about || "",
        languages: hero.languages || [],
        servicetype: hero.service_types || [],
        contactNumber: hero.contact?.phone_number || "",
        location: hero.location || {},
        paymentMethods: hero.paymentMethods || [],
        profile_setup_completed: hero.profile_setup_completed
      },
      "Hero basic profile created/updated"
    )
  );
});



// PUT /api/hero/profile/:hero_id - Update hero profile by id
export const updateHeroProfileById = asyncHandler(async (req, res) => {
  const { hero_id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(hero_id)) {
    throw new ApiError(400, "Invalid hero_id");
  }

  const {
    hero_name,
    about,
    languages,
    service_types,
    contact,
    location,
    payment_method
  } = req.body;

  // Required field validation
  if (!hero_name || !about) {
    throw new ApiError(400, "hero_name and about are required");
  }

  // Convert arrays if they come as stringified JSON
  const normalizeArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    if (typeof val === "string") {
      return val.split(",").map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  const languagesArr = normalizeArray(languages);
  const serviceTypesArr = normalizeArray(service_types);

  // Convert nested objects if they come as strings
  const contactObj =
    typeof contact === "string" ? JSON.parse(contact) : contact || {};
  const locationObj =
    typeof location === "string" ? JSON.parse(location) : location || {};
  const paymentMethodObj =
    typeof payment_method === "string" ? JSON.parse(payment_method) : payment_method || {};

  // Handle profile picture upload (optional)
  let profilePictureUrl;
  if (req.file) {
    profilePictureUrl = await uploadToS3(req.file); // Or your own file upload logic
  }

  // Build update object
  const heroUpdate = {
    hero_name,
    about,
    languages: languagesArr,
    service_types: serviceTypesArr,
    contact: {
      country_code: contactObj.country_code || "",
      phone_number: contactObj.phone_number || ""
    },
    location: {
      address: locationObj.address || "",
      latitude: locationObj.latitude || null,
      longitude: locationObj.longitude || null
    },
    payment_method: {
      method_id: paymentMethodObj.method_id || "",
      method_name: paymentMethodObj.method_name || ""
    }
  };

  if (profilePictureUrl) {
    heroUpdate.profile_picture = profilePictureUrl;
  }

  // Update hero in DB
  const hero = await Hero.findOneAndUpdate(
    { _id: hero_id },
    { $set: heroUpdate },
    { new: true }
  );

  if (!hero) {
    throw new ApiError(404, "Hero not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, hero, "Hero profile updated successfully"));
});

// ================== PROFILE SETUP ===================

// POST /api/hero/profile/setup - Setup detailed hero profile

export const setupHeroProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { hero_id, usertype, gender, industry, skills, education, documents } = req.body;

  // normalize arrays
  const normalizeArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return [];
  };

  const skillArr = normalizeArray(skills);
  const eduArr = normalizeArray(education);
  const docArr = normalizeArray(documents);

  // add uploaded files
  const uploadedDocs = req.files?.documents?.map(f => ({
    documentType: f.originalname,
    documentUrl: `/uploads/documents/${f.filename}`
  })) || [];
  const allDocs = [...docArr, ...uploadedDocs];

  const heroUpdate = {
    personal_info: { role: usertype, gender, industry },
    skills_education: { skills: skillArr, education: eduArr },
    documents: allDocs,
    profile_setup_completed: true
  };

  const query = hero_id ? { _id: hero_id, user: userId } : { user: userId };
  const hero = await Hero.findOneAndUpdate(
    query,
    { $set: heroUpdate, $setOnInsert: { user: userId } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // --- RESPONSE JSON ---
  return res.status(200).json(
    new ApiResponse(200,
      {
        hero_id: hero._id,
        usertype: hero.personal_info?.role || "",
        gender: hero.personal_info?.gender || "",
        industry: hero.personal_info?.industry || "",
        skills: hero.skills_education?.skills || [],
        education: hero.skills_education?.education || [],
        documents: hero.documents || [],
        profile_setup_completed: hero.profile_setup_completed
      },
      "Hero detailed profile setup completed successfully"
    )
  );
});

// GET /api/hero/profile/status - Check if hero profile is completed
export const getHeroProfileStatus = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  // fetch hero & user
  const hero = await Hero.findOne({ user: userId });
  const user = await User.findById(userId);

  if (!hero || !user) {
    return res.status(200).json(
      new ApiResponse(
        200,
        { profile_setup_completed: false, missing_fields: [] },
        "Hero profile not found"
      )
    );
  }

  const missingFields = [];

  // === HERO checks (based on updated schema) ===
  if (!hero.companyName) missingFields.push("companyName");
  if (!hero.about) missingFields.push("about");
  if (!hero.profile_picture) missingFields.push("profile_picture");
  if (!hero.languages || hero.languages.length === 0) missingFields.push("languages");
  if (!hero.servicetype || hero.servicetype.length === 0) missingFields.push("servicetype");
  if (!hero.contactNumber) missingFields.push("contactNumber");

  // location check (GeoJSON Point)
  if (
    !hero.location ||
    !hero.location.coordinates ||
    hero.location.coordinates.length !== 2
  ) {
    missingFields.push("location.coordinates");
  }

  if (!hero.paymentMethods || hero.paymentMethods.length === 0)
    missingFields.push("paymentMethods");

  if (!hero.skills || hero.skills.length === 0) missingFields.push("skills");
  if (!hero.education || hero.education.length === 0) missingFields.push("education");
  if (!hero.documents || hero.documents.length === 0) missingFields.push("documents");

  const profileCompleted = missingFields.length === 0;

  // auto-update the flag
  if (hero.profile_setup_completed !== profileCompleted) {
    hero.profile_setup_completed = profileCompleted;
    await hero.save();
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        profile_setup_completed: profileCompleted,
        missing_fields: missingFields,
      },
      "Hero profile status fetched successfully"
    )
  );
});


// Register as a task hero
// export const registerHero = asyncHandler(async (req, res) => {
//   const { email, password} = req.body;
//   if ( !email || !password ) throw new ApiError(400, "All fields are required");
//   const existedUser = await User.findOne({ email });
//   if (existedUser) throw new ApiError(409, "User already exists");
//   const hashedPassword = await bcrypt.hash(password, 10);
//   const user = await User.create({  email, password: hashedPassword });
//   const hero = await Hero.create({ user: user._id});
//   return res.status(201).json(new ApiResponse(201, { user, hero }, "Hero registered successfully"));
// });

// // Login hero account
// export const loginHero = asyncHandler(async (req, res) => {
//   const { email, password } = req.body;
//   const user = await User.findOne({ email });
//   if (!user) throw new ApiError(404, "User not found");
//   const isPasswordValid = await bcrypt.compare(password, user.password);
//   if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");
//   // Generate tokens (implement as in your auth flow)
//   const accessToken = user.generateAccessToken();
//   const refreshToken = user.generateRefreshToken();
//   return res.status(200).json(new ApiResponse(200, { accessToken, refreshToken }, "Login successful"));
// });

// // Logout hero (just clear tokens on client)
// export const logoutHero = asyncHandler(async (req, res) => {
//   return res.status(200).json(new ApiResponse(200, {}, "Logout successful"));
// });

// // Fetch hero profile
// export const getHeroProfile = asyncHandler(async (req, res) => {
//   const hero = await Hero.findOne({ user: req.user.id }).populate('user').populate('services');
//   if (!hero) throw new ApiError(404, "Hero not found");
//   return res.status(200).json(new ApiResponse(200, hero, "Hero profile fetched"));
// });
// export const updateHeroProfile = async (req, res) => {
//   try {
//     const userId = req.user.id; // from JWT

//     if (!userId) {
//       return res.status(400).json({ error: 'User ID is required' });
//     }

    

//     const {
//       profile_picture,
//       companyName,
//       about,
//       languages,
//       servicetype,
//       phone,
//       location,
//       paymentMethods
//     } = req.body;

//     // Update Hero details
//     const updatedHero = await Hero.findOneAndUpdate(
//       { user: userId },
//       {
//         companyName,
//         about,
//         languages,
//         servicetype,
//         paymentMethods
//       },
//       { new: true, upsert: true }
//     );

//     // Update User details (profile picture and location)
//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       {
//         profile_picture,
//         phone,
//         location
//       },
//       { new: true }
//     );

//     res.status(200).json({
//       message: 'Hero profile updated',
//       profile: updatedHero,
//       user: updatedUser
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server Error' });
//   }
// };


// export const setupHeroProfile = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const {
//       usertype,
//       gender,
//       industry,
//       skills,
//       education,
//       documents
//     } = req.body;
   

   
//     const hero = await Hero.findOneAndUpdate(
//       { user: userId },
//       {
//         usertype,
//         gender,
//         industry,
//         skills,
//         education,
//         documents
//       },
//       { new: true, upsert: true }
//     );

//     res.status(200).json({ message: 'Hero setup completed', hero });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server Error' });
//   }
// };

// Change hero password
export const changeHeroPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  // Check for missing parameters
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Both oldPassword and newPassword are required");
  }

  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "User not found");

  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordValid) throw new ApiError(401, "Old password incorrect");

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});


export const postFoodService = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  try {
    const {
      title,
      description,
      price,
      paymentMethod,
      foodType,
      orderType,
      dimensions,
      calories,
      additionalDetail
    } = req.body;

    // Handle categories (array or string)
    let categories = req.body.categories;
    if (typeof categories === 'string') {
      try { categories = JSON.parse(categories); } catch { categories = [categories]; }
    }
    if (!Array.isArray(categories)) categories = [];

    if (categories.length) {
      // Find or create categories by name, or use IDs directly
      const categoryIds = await Promise.all(categories.map(async (cat) => {
        if (typeof cat === 'string' && !cat.match(/^[0-9a-fA-F]{24}$/)) {
          let found = await Category.findOne({ name: { $regex: `^${cat.trim()}$`, $options: 'i' } });
          if (!found) {
            found = await Category.create({ name: cat.trim() });
          }
          return found._id;
        }
        return cat; // Already an ID
      }));
      categories = categoryIds;
    }

    const serviceImages = (req.files && req.files.serviceImages)
      ? req.files.serviceImages.map(file => `public/uploads/ServiceImages/${file.filename}`)
      : [];

    const ingredientReceipt = (req.files && req.files.ingredientReceipt && req.files.ingredientReceipt[0])
      ? `public/uploads/IngredientReceipts/${req.files.ingredientReceipt[0].filename}`
      : "";
        

    const service = new Service({
      providerUserId: req.user.id,
      title,
      description,
      price,
      paymentMethod: Array.isArray(paymentMethod) ? paymentMethod : [paymentMethod],
      foodType,
      orderType: Array.isArray(orderType) ? orderType : [orderType],
      dimensions: {
        weightInGrams: dimensions?.weightInGrams,
        weightInKg: dimensions?.weightInKg
      },
      calories,
      additionalDetail: typeof additionalDetail === 'string'
        ? JSON.parse(additionalDetail)
        : additionalDetail,
      images: serviceImages || [],
      ingredientReceipt,
      categories
    });

    await service.save();

    res.status(201).json({ success: true, service });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};


export const postGigService = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  try {
    const {
      title,
      description,
      servicetype,
      orderType,
      deliverBy,
      additionalDetail,
      paymentMethod,
      levelOfService
    } = req.body;

    // ✅ Parse structured fields if sent as strings
    const parsedAdditionalDetail =
      typeof additionalDetail === "string"
        ? JSON.parse(additionalDetail)
        : additionalDetail;

    const parsedLevelOfService =
      typeof levelOfService === "string"
        ? JSON.parse(levelOfService)
        : levelOfService;

    // ✅ Handle file paths
    const serviceImages = req.files?.serviceImages?.map((file) => 
      `public/uploads/ServiceImages/${file.filename}`
    );

    const uploadDocuments = req.files?.Gigdoc?.map((file) =>
      `public/uploads/Gigdoc/${file.filename}`
    );
    // Handle categories (array of names or IDs, or string)
    let categories = req.body.categories;
    if (typeof categories === 'string') {
      try { categories = JSON.parse(categories); } catch { categories = [categories]; }
    }
    if (!Array.isArray(categories)) categories = [];

    if (categories.length) {
      // Find or create categories by name, or use IDs directly (case-insensitive, trimmed)
      const categoryIds = await Promise.all(categories.map(async (cat) => {
        if (typeof cat === 'string' && !cat.match(/^[0-9a-fA-F]{24}$/)) {
          let found = await Category.findOne({ name: { $regex: `^${cat.trim()}$`, $options: 'i' } });
          if (!found) {
            found = await Category.create({ name: cat.trim() });
          }
          return found._id;
        }
        return cat; // Already an ID
      }));
      categories = categoryIds;
    }

    // ✅ Create and save the gig service
    const service = new Service({
      providerUserId: req.user.id,
      title,
      description,
      images: serviceImages || [],
      servicetype,
      orderType: Array.isArray(orderType) ? orderType : [orderType],
      deliverBy,
      additionalDetail: parsedAdditionalDetail || [],
      paymentMethod,
      levelOfService: parsedLevelOfService || [],
      uploadDocuments: uploadDocuments || [],
      categories
    });

    await service.save();

    res.status(201).json({ success: true, service });
  } catch (error) {
    console.error("Error in postGigService:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// ================== NON-FOOD SERVICE CRUD (Multi-vendor) ===================

const toArray = (val) => {
  if (val === undefined || val === null) return undefined;
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return val.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return undefined;
};

const mapAdditional = (additional) => {
  const arr = toArray(additional);
  if (!arr) return undefined;
  return arr.map((item) => {
    if (typeof item === "string") return { name: item };
    if (item && typeof item === "object") {
      return { name: item.name || item.title || "Option", description: item.description || "" };
    }
    return { name: String(item) };
  });
};

const mapLevels = (levels) => {
  const arr = toArray(levels);
  if (!arr) return undefined;
  return arr.map((lvl) => {
    if (typeof lvl === "string") {
      try {
        const parsed = JSON.parse(lvl);
        lvl = parsed;
      } catch {}
    }
    const moreOption = toArray(lvl?.moreOption);
    const moreOptions = (moreOption || []).map((opt) => ({ name: String(opt) }));
    return {
      levelName: lvl?.level_name ?? lvl?.levelName ?? "Level",
      setPrice: lvl?.set_price ?? lvl?.setPrice ?? 0,
      setTimePerHours: lvl?.set_time ?? lvl?.setTimePerHours ?? "",
      moreOptions
    };
  });
};

const buildServicePayloadFromRequest = (req) => {
  const {
    title,
    description,
    attach_image,
    service_type,
    order_type,
    delivery_by,
    additional,
    paymentMethod,
    level,
    uploadDocuments
  } = req.body;

  const images = toArray(attach_image);
  const orderType = toArray(order_type);
  const docs = toArray(uploadDocuments);
  const additionalDetail = mapAdditional(additional);
  const levelOfService = mapLevels(level);

  const payload = {};
  if (title !== undefined) payload.title = title;
  if (description !== undefined) payload.description = description;
  if (images !== undefined) payload.images = images;
  if (service_type !== undefined) payload.servicetype = service_type;
  if (orderType !== undefined) payload.orderType = orderType;
  if (delivery_by !== undefined) payload.deliverBy = delivery_by;
  if (additionalDetail !== undefined) payload.additionalDetail = additionalDetail;
  if (paymentMethod !== undefined) payload.paymentMethod = typeof paymentMethod === "string" ? (() => { try { return JSON.parse(paymentMethod); } catch { return paymentMethod; } })() : paymentMethod;
  if (levelOfService !== undefined) payload.levelOfService = levelOfService;
  if (docs !== undefined) payload.uploadDocuments = docs;
  return payload;
};

// POST /api/hero/non-food-service
export const createNonFoodService = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const payload = buildServicePayloadFromRequest(req);
  if (!payload.title) throw new ApiError(400, "title is required");

  const service = await Service.create({
    ...payload,
    providerUserId: userId,
  });

  // Link to hero document
  await Hero.findOneAndUpdate(
    { user: userId },
    { $addToSet: { services: service._id } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return res.status(201).json(new ApiResponse(201, service, "Service created"));
});

// GET /api/hero/services
export const getMyServices = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");
  const services = await Service.find({ providerUserId: userId }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, services, "Services fetched"));
});

// GET /api/hero/services/:id
export const getMyServiceById = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;
  if (!userId) throw new ApiError(401, "Unauthorized");
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid id");

  const service = await Service.findOne({ _id: id, providerUserId: userId });
  if (!service) throw new ApiError(404, "Service not found");
  return res.status(200).json(new ApiResponse(200, service, "Service fetched"));
});

// PUT /api/hero/services/:id
export const updateMyService = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;
  if (!userId) throw new ApiError(401, "Unauthorized");
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid id");

  const payload = buildServicePayloadFromRequest(req);
  const service = await Service.findOneAndUpdate(
    { _id: id, providerUserId: userId },
    { $set: payload },
    { new: true }
  );
  if (!service) throw new ApiError(404, "Service not found");
  return res.status(200).json(new ApiResponse(200, service, "Service updated"));
});

// DELETE /api/hero/services/:id
export const deleteMyService = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;
  if (!userId) throw new ApiError(401, "Unauthorized");
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid id");

  const service = await Service.findOneAndDelete({ _id: id, providerUserId: userId });
  if (!service) throw new ApiError(404, "Service not found");

  await Hero.findOneAndUpdate({ user: userId }, { $pull: { services: id } });
  return res.status(200).json(new ApiResponse(200, {}, "Service deleted"));
});


// Update a service
export const updateHeroService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const update = req.body;
  const service = await Service.findOneAndUpdate({ _id: id, providerUserId: req.user.id }, update, { new: true });
  if (!service) throw new ApiError(404, "Service not found");
  return res.status(200).json(new ApiResponse(200, service, "Service updated"));
});

// Delete a service
export const deleteHeroService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const service = await Service.findOneAndDelete({ _id: id, providerUserId: req.user.id });
  if (!service) throw new ApiError(404, "Service not found");
  await Hero.findOneAndUpdate({ user: req.user.id }, { $pull: { services: id } });
  return res.status(200).json(new ApiResponse(200, {}, "Service deleted"));
});

// List hero's services
export const listHeroServices = asyncHandler(async (req, res) => {
  const hero = await Hero.findOne({ user: req.user.id }).populate('services');
  if (!hero) throw new ApiError(404, "Hero not found");
  return res.status(200).json(new ApiResponse(200, hero.services, "Services fetched"));
});


export const getHeroOrders = asyncHandler(async (req, res) => {
  const providerId = req.user.id; // assuming auth middleware sets this

  const orders = await Order.find({ provider_ids: providerId })
    .populate('user', 'name email') // Optional: populate user info
    .populate('cart') // Optional: populate cart info
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, orders, "Orders for provider fetched"));
});


// Get booking details
export const getHeroOrderDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await Order.findById(id).populate('user').populate({ path: 'cart', populate: { path: 'items.service' } });
  if (!order) throw new ApiError(404, "Order not found");
  return res.status(200).json(new ApiResponse(200, order, "Booking details fetched"));
});

// Accept booking
export const acceptHeroOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await Order.findByIdAndUpdate(id, { status: 'placed', confirmation: true }, { new: true });
  if (!order) throw new ApiError(404, "Order not found");
  return res.status(200).json(new ApiResponse(200, order, "Booking accepted"));
});

// Reject booking
export const rejectHeroOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await Order.findByIdAndUpdate(id, { status: 'cancelled', confirmation: false }, { new: true });
  if (!order) throw new ApiError(404, "Order not found");
  return res.status(200).json(new ApiResponse(200, order, "Booking rejected"));
});

// Update service status
export const updateHeroOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
  if (!order) throw new ApiError(404, "Order not found");
  return res.status(200).json(new ApiResponse(200, order, "Order status updated"));
});

// Get message history for order (stub)
export const getOrderMessages = asyncHandler(async (req, res) => {
  // Implement chat/message logic as needed
  return res.status(200).json(new ApiResponse(200, [], "Message history fetched (stub)"));
});

// Send message to customer (stub)
export const sendOrderMessage = asyncHandler(async (req, res) => {
  // Implement chat/message logic as needed
  return res.status(201).json(new ApiResponse(201, {}, "Message sent (stub)"));
});

// View earnings and stats (dashboard)
export const getHeroDashboard = asyncHandler(async (req, res) => {
  const hero = await Hero.findOne({ user: req.user.id });
  if (!hero) throw new ApiError(404, "Hero not found");
  // Calculate stats as needed
  return res.status(200).json(new ApiResponse(200, { earnings: hero.earnings }, "Dashboard fetched"));
});

// Past completed services (history)
export const getHeroHistory = asyncHandler(async (req, res) => {
  // Find the hero by the authenticated user
  const hero = await Hero.findOne({ user: req.user.id });
  if (!hero) throw new ApiError(404, "Hero not found");

  // Find all services provided by this hero
  const services = await Service.find({ providerUserId: req.user.id });
  const serviceIds = services.map(s => s._id);

  // Find all orders that include any of the hero's services and are completed
  const orders = await Order.find({
    status: 'completed',
    'cart.items.service': { $in: serviceIds }
  })
    .populate({
      path: 'cart',
      populate: {
        path: 'items.service',
        model: 'Service'
      }
    })
    .populate('user')
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, orders, "Complete hero history fetched"));
});

// Hero's customer feedback
export const getHeroReviews = asyncHandler(async (req, res) => {
  const hero = await Hero.findOne({ user: req.user.id });
  if (!hero) throw new ApiError(404, "Hero not found");
  const reviews = await Review.find({ hero: hero._id }).populate('user');
  return res.status(200).json(new ApiResponse(200, reviews, "Hero reviews fetched"));
});

// POST /api/hero/category - Create a new category by name
export const createCategory = asyncHandler(async (req, res) => {
  const { name, image, parent_id } = req.body;
  if (!name) return res.status(400).json({ success: false, message: "Category name is required" });
  const existing = await Category.findOne({ name });
  if (existing) return res.status(409).json({ success: false, message: "Category already exists" });
  const category = await Category.create({ name, image, parent_id: parent_id || null });
  return res.status(201).json({ success: true, category });
});

// GET /api/hero/categories-with-services - Get all categories with their services
export const getCategoriesWithServices = asyncHandler(async (req, res) => {
  const categories = await Category.find();
  const Service = (await import("../../models/servicemodel.js")).Service;
  const categoriesWithServices = await Promise.all(categories.map(async (cat) => {
    const services = await Service.find({ categories: cat._id });
    return { ...cat.toObject(), services };
  }));
  return res.status(200).json({ success: true, categories: categoriesWithServices });
});

// GET /api/hero/categories - Get all categories
export const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find();
  return res.status(200).json({ success: true, categories });
});

// GET /api/hero/category/:name/services - Get all services for a given category name
export const getServicesByCategoryName = asyncHandler(async (req, res) => {
  let { name } = req.params;
  name = name.trim();
  const category = await Category.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
  if (!category) return res.status(404).json({ success: false, message: "Category not found" });
  const Service = (await import("../../models/servicemodel.js")).Service;
  const services = await Service.find({ categories: category._id });
  return res.status(200).json({ success: true, services });
});