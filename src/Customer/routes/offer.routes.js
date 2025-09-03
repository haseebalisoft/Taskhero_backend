import express from 'express';
import { acceptOffer,declineOffer , createOffer, updateOffer } from '../controllers/offer.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();
router.post('/post', authenticate, createOffer);
router.post('/updateprice', authenticate, updateOffer);

router.post('/accept', authenticate, acceptOffer);
router.post('/decline', authenticate, declineOffer);

export default router;
