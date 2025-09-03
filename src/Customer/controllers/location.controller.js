import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import axios from "axios";

const fetchLocationFromMap = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    throw new ApiError(400, "Latitude and longitude are required");
  }

  // Using Nominatim (OpenStreetMap) for geocoding
  const response = await axios.get(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
  );

  return res.status(200).json(
    new ApiResponse(200, response.data, "Location fetched successfully")
  );
});

const reverseGeocode = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.query;
  
  if (!latitude || !longitude) {
    throw new ApiError(400, "Latitude and longitude are required");
  }

  const response = await axios.get(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
  );

  return res.status(200).json(
    new ApiResponse(200, response.data, "Address fetched successfully")
  );
});

export { fetchLocationFromMap, reverseGeocode };