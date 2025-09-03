import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/usersmodel.js";
import { Service } from "../../models/servicemodel.js";
import { Offer } from "../../models/Offer.js";
import { Task } from "../../models/Task.js";
import { Category } from "../../models/categorymodel.js";

const mapStatusToLabelAndColor = (offerStatus) => {
  switch (offerStatus) {
    case "accepted":
      return { label: "Accepted", color: "blue" };
    case "pending":
      return { label: "Pending", color: "orange" };
    case "declined":
      return { label: "Declined", color: "red" };
    default:
      return { label: "Unknown", color: "gray" };
  }
};

// Accepts "YYYY-MM-DD" or an ISO date string starting with that pattern.
// Returns a Date at 00:00:00.000 UTC for the given day, or null if invalid.
const parseISODateOnly = (value) => {
  if (!value) return null;
  const input = String(value).trim();
  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
};

export const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const [
    userDoc,
    servicesCount,
    acceptedOffersList,
    acceptedOffersCount,
    pendingOffersCount,
    totalOffersCount
  ] = await Promise.all([
    User.findById(userId).lean(),
    Service.countDocuments({ providerUserId: userId }),
    Offer.find({ user: userId, status: "accepted" })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("task")
      .lean(),
    Offer.countDocuments({ user: userId, status: "accepted" }),
    Offer.countDocuments({ user: userId, status: "pending" }),
    Offer.countDocuments({ user: userId })
  ]);

  const categoryIdSet = new Set();
  (acceptedOffersList || []).forEach((offer) => {
    if (offer?.task?.category_id) categoryIdSet.add(String(offer.task.category_id));
  });
  const categoryIds = Array.from(categoryIdSet);
  const categories = categoryIds.length
    ? await Category.find({ _id: { $in: categoryIds } }).lean()
    : [];
  const categoryMap = new Map(categories.map((c) => [String(c._id), c.name]));

  const activeList = (acceptedOffersList || []).map((offer) => {
    const task = offer.task;
    const { label, color } = mapStatusToLabelAndColor(offer.status);
    const categoryName = task?.category_id ? categoryMap.get(String(task.category_id)) : undefined;

    return {
      id: task?._id,
      title: categoryName || (task?.description ? task.description.substring(0, 40) : "Task"),
      date: task?.createdAt || offer?.createdAt,
      status: label,
      status_color: color,
      notes: task?.status === "open" ? "Action Required" : null,
      image: Array.isArray(task?.images) && task.images.length > 0 ? task.images[0] : null
    };
  });

  const dashboardPayload = {
    user: {
      name: userDoc?.fullName || userDoc?.hero_name || userDoc?.email || "User",
      role:
        userDoc?.personal_info?.role ||
        (Array.isArray(userDoc?.service_types) && userDoc.service_types.includes("Food")
          ? "Food Hero"
          : "Hero"),
      avatar: userDoc?.profile_picture || null
    },
    tasks: {
      active_count: acceptedOffersCount || 0,
      scheduled_count: pendingOffersCount || 0,
      active_list: activeList
    },
    services: {
      count: servicesCount || 0
    },
    offers: {
      count: totalOffersCount || 0
    }
  };

  return res
    .status(200)
    .json(new ApiResponse(200, dashboardPayload, "Dashboard data fetched successfully"));
});

export const getScheduledTasks = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { start, end } = req.query || {};
  if (!start || !end) {
    return res.status(400).json({ message: "Query params 'start' and 'end' are required in YYYY-MM-DD format" });
  }

  const startDayUtc = parseISODateOnly(start);
  const endDayUtc = parseISODateOnly(end);
  if (!startDayUtc || !endDayUtc) {
    return res.status(400).json({ message: "Invalid 'start' or 'end' date" });
  }
  if (startDayUtc > endDayUtc) {
    return res.status(400).json({ message: "'start' must be on or before 'end'" });
  }

  const startDate = startDayUtc; // 00:00:00.000Z
  const endDate = new Date(endDayUtc.getTime());
  endDate.setUTCHours(23, 59, 59, 999); // 23:59:59.999Z

  const offers = await Offer.find({
    user: userId,
    status: { $in: ["accepted", "pending"] },
    createdAt: { $gte: startDate, $lte: endDate }
  })
    .sort({ createdAt: -1 })
    .populate("task")
    .lean();

  // Prepare category names for titles
  const categoryIdSet = new Set();
  (offers || []).forEach((offer) => {
    if (offer?.task?.category_id) categoryIdSet.add(String(offer.task.category_id));
  });
  const categoryIds = Array.from(categoryIdSet);
  const categories = categoryIds.length
    ? await Category.find({ _id: { $in: categoryIds } }).lean()
    : [];
  const categoryMap = new Map(categories.map((c) => [String(c._id), c.name]));

  const items = (offers || []).map((offer) => {
    const task = offer.task;
    const { label, color } = mapStatusToLabelAndColor(offer.status);
    const categoryName = task?.category_id ? categoryMap.get(String(task.category_id)) : undefined;
    const date = (task?.createdAt || offer?.createdAt);

    return {
      id: task?._id,
      title: categoryName || (task?.description ? task.description.substring(0, 40) : "Task"),
      date,
      status: label,
      status_color: color,
      notes: task?.status === "open" ? "Action Required" : null,
      image: Array.isArray(task?.images) && task.images.length > 0 ? task.images[0] : null
    };
  });

  // Group by date (YYYY-MM-DD, UTC)
  const groupMap = new Map();
  for (const item of items) {
    const day = new Date(item.date).toISOString().slice(0, 10);
    if (!groupMap.has(day)) groupMap.set(day, []);
    groupMap.get(day).push(item);
  }

  const days = Array.from(groupMap.entries())
    .map(([date, tasks]) => ({ date, tasks }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  return res
    .status(200)
    .json(new ApiResponse(200, days, "Scheduled tasks fetched successfully"));
}); 