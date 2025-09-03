import { asyncHandler } from "../../utils/asyncHandler.js"; 
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { Hero } from "../../models/Hero.js";
import { Review } from "../../models/Review.js";


export const getHeroProfile = asyncHandler(async (req, res) => {
  const { hero_id } = req.params;
  const hero = await Hero.findById(hero_id).populate('user').populate('services');
  if (!hero) {
    throw new ApiError(404, "Hero not found");
  }
  return res.status(200).json(new ApiResponse(200, hero, "Hero profile fetched"));
});

export const getHeroReviews = asyncHandler(async (req, res) => {
  const { hero_id } = req.params;
  const reviews = await Review.find({ hero: hero_id }).populate('user');
  return res.status(200).json(new ApiResponse(200, reviews, "Hero reviews fetched"));
});

export const getHeroServices = asyncHandler(async (req, res) => {
  const { hero_id } = req.params;
  const hero = await Hero.findById(hero_id).populate('services');
  if (!hero) throw new ApiError(404, "Hero not found");
  return res.status(200).json(new ApiResponse(200, hero.services, "Hero services fetched"));
});

export const rateHero = asyncHandler(async (req, res) => {
  const { hero_id } = req.params;
  const { user_id, rating, review, order_id } = req.body;

  const hero = await Hero.findById(hero_id);
  if (!hero) throw new ApiError(404, "Hero not found");

  const newReview = await Review.create({
    hero: hero_id,
    user: user_id,
    rating,
    review,
    order_id
  });

  // Optionally update average rating
  const reviews = await Review.find({ hero: hero_id });
  const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
  hero.rating = avgRating.toFixed(1);
  await hero.save();

  return res.status(201).json(new ApiResponse(201, newReview, "Review submitted successfully"));
});