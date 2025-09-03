import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Category } from "../../models/categorymodel.js";
import { Service } from "../../models/servicemodel.js";
import { SubscriptionPlan } from "../../models/subscriptionmodel.js";
import mongoose from "mongoose";

const getHomeDashboard = asyncHandler(async (req, res) => {
  const categories = await Category.find({ parent_id: null }).limit(10);
  const popularServices = await Service.find().sort({ rating: -1 }).limit(5);
  const premiumServices = await Service.find({ is_premium: true }).limit(5);

  return res.status(200).json(
    new ApiResponse(200, {
      categories,
      popularServices,
      premiumServices
    }, "Dashboard data fetched successfully")
  );
});

const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ parent_id: null });
  return res.status(200).json(
    new ApiResponse(200, categories, "Categories fetched successfully")
  );
});

const getSubcategories = asyncHandler(async (req, res) => {
  const { category_id } = req.params;
  console.log('route hit')
  // ✅ Validate if it's a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(category_id)) {
    throw new ApiError(400, "Invalid category ID");
  }

  const subcategories = await Category.find({
    parent_id: new mongoose.Types.ObjectId(category_id)
  });

  return res.status(200).json(
    new ApiResponse(200, subcategories, "Subcategories fetched successfully")
  );
});


const getServicesByCategory = asyncHandler(async (req, res) => {
  const { category_id, location } = req.query;
  let query = {};
  
  if (category_id) {
    query.category_id = category_id;
  }

  if (location) {
    const [lng, lat] = location.split(",").map(Number);
    query.location = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat]
        },
        $maxDistance: 10000 // 10km radius
      }
    };
  }

  const services = await Service.find(query);
  return res.status(200).json(
    new ApiResponse(200, services, "Services fetched successfully")
  );
});

const searchServices = asyncHandler(async (req, res) => {
  const { query, location } = req.query;
  let searchQuery = { name: { $regex: query, $options: 'i' } };

  if (location) {
    const [lng, lat] = location.split(",").map(Number);
    searchQuery.location = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat]
        },
        $maxDistance: 10000 // 10km radius
      }
    };
  }

  const services = await Service.find(searchQuery);
  return res.status(200).json(
    new ApiResponse(200, services, "Services searched successfully")
  );
});

const getServiceDetails = asyncHandler(async (req, res) => {
  const { service_id } = req.params;

  // Validate service_id as a valid ObjectId before querying
  if (!service_id || !/^[0-9a-fA-F]{24}$/.test(service_id.trim())) {
    throw new ApiError(400, "Invalid service ID format");
  }

  const service = await Service.findById(service_id.trim());

  if (!service) {
    throw new ApiError(404, "Service not found");
  }

  return res.status(200).json(
    new ApiResponse(200, service, "Service details fetched successfully")
  );
});

const getServicesBySubcategory = asyncHandler(async (req, res) => {
  const { subcategory_id } = req.params;
  const services = await Service.find({ subcategory_id });

  return res.status(200).json(
    new ApiResponse(200, services, "Services fetched by subcategory successfully")
  );
});

const sortOrFilterServices = asyncHandler(async (req, res) => {
  const { sort, filter } = req.query;
  let query = {};
  let sortOption = {};

  if (filter) {
    query = JSON.parse(filter);
  }

  if (sort) {
    sortOption = JSON.parse(sort);
  }

  const services = await Service.find(query).sort(sortOption);
  return res.status(200).json(
    new ApiResponse(200, services, "Services sorted/filtered successfully")
  );
});

const getPremiumServicesInfo = asyncHandler(async (req, res) => {
  const premiumServices = await Service.find({ is_premium: true });
  const subscriptionPlans = await SubscriptionPlan.find();

  return res.status(200).json(
    new ApiResponse(200, { premiumServices, subscriptionPlans }, "Premium services info fetched successfully")
  );
});

export {
  getHomeDashboard,
  getServicesByCategory,
  searchServices,
  getAllCategories,
  getSubcategories,
  getServicesBySubcategory,
  getServiceDetails,
  sortOrFilterServices,
  getPremiumServicesInfo
};