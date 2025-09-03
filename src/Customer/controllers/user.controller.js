import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/usersmodel.js";
import mongoose from "mongoose";

const completeProfile = asyncHandler(async (req, res) => {


  const { fullName, gender, dob, phone, location } = req.body;
  const userId = req.user.id;

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        fullName,
        gender,
        dob,
        phone,
        location: {
          type: "Point",
          coordinates: [
            parseFloat(location.lng),
            parseFloat(location.lat)
          ]
        },
        profile_picture: req.file?.path
      }
    },
    { new: true }
  ).select("-password -refreshToken");

  return res.status(200).json(
    new ApiResponse(200, user, "Profile updated successfully")
  );
});





// Address related functions
const getUserAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("addresses");
  return res.status(200).json(
    new ApiResponse(200, user.addresses, "Addresses fetched successfully")
  );
});

const addNewAddress = asyncHandler(async (req, res) => {
  const { address_type, country, city, state, zip_code, address_line1, address_line2 } = req.body;
  
  

  // Validate required fields
  if (!address_type || !country || !city || !state || !zip_code || !address_line1) {
    throw new ApiError(400, "All address fields except address_line2 are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      $push: {
        addresses: {
          address_type,
          country,
          city,
          state,
          zip_code,
          address_line1,
          address_line2: address_line2 || "",
          is_default: false
        }
      }
    },
    { new: true }
  ).select("addresses");

  return res.status(200).json(
    new ApiResponse(200, user.addresses, "Address added successfully")
  );
});

// const updateAddress = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { address_type, country, city, state, zip_code, address_line1, address_line2 } = req.body;
 


//   const user = await User.findOneAndUpdate(
//     { _id: req.user.id, "addresses._id": id },
//     {
//       $set: {
//         "addresses.$": {
//           _id: id, // <-- ✅ required
//           address_type,
//           country,
//           city,
//           state,
//           zip_code,
//           address_line1,
//           address_line2,
//           is_default: false // optional
//         }
//       }
//     },
//     { new: true }
//   );
  

//   if (!user) {
//     throw new ApiError(404, "Address not found");
//   }

//   return res.status(200).json(
//     new ApiResponse(200, user.addresses, "Address updated successfully")
//   );
// });

const updateAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { address_type, country, city, state, zip_code, address_line1, address_line2 } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid address ID");
  }

  const user = await User.findOneAndUpdate(
    { _id: req.user.id, "addresses._id": id },
    {
      $set: {
        "addresses.$.address_type": address_type,
        "addresses.$.country": country,
        "addresses.$.city": city,
        "addresses.$.state": state,
        "addresses.$.zip_code": zip_code,
        "addresses.$.address_line1": address_line1,
        "addresses.$.address_line2": address_line2
      }
    },
    { new: true }
  ).select("addresses");

  if (!user) {
    throw new ApiError(404, "Address not found");
  }

  return res.status(200).json(
    new ApiResponse(200, user.addresses, "Address updated successfully")
  );
});


const deleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $pull: { addresses: { _id: id } } },
    { new: true }
  ).select("addresses");

  return res.status(200).json(
    new ApiResponse(200, user.addresses, "Address deleted successfully")
  );
});

const setDefaultAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(req.user.id);

  user.addresses.forEach(address => {
    address.is_default = address._id.toString() === id;
  });

  await user.save();

  return res.status(200).json(
    new ApiResponse(200, user.addresses, "Default address set successfully")
  );
});

const updateLanguage = asyncHandler(async (req, res) => {
  const { language } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { language },
    { new: true }
  ).select("-password -refreshToken");

  return res.status(200).json(
    new ApiResponse(200, user, "Language updated successfully")
  );
});
 const saveUserInterests = asyncHandler(async (req, res) => {
  const { interests } = req.body;
  if (!Array.isArray(interests) || interests.length === 0) {
    throw new ApiError(400, "Interests array is required");
  }
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { interests },
    { new: true }
  ).select("interests");
  return res.status(200).json(new ApiResponse(200, user.interests, "Interests saved"));
});

export {
  completeProfile,
  getUserAddresses,
  addNewAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  updateLanguage,
  saveUserInterests
};