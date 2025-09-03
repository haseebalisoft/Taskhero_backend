import express from 'express';
import {
  getHeroProfile,
  getHeroReviews,
  getHeroServices,
  rateHero
} from '../../Customer/controllers/hero.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/:hero_id', authenticate, getHeroProfile);
router.get('/:hero_id/reviews', authenticate, getHeroReviews);
router.get('/:hero_id/services', authenticate, getHeroServices);
router.post('/:hero_id/rate', authenticate, rateHero);

export default router;