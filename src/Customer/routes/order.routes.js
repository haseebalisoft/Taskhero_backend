import express from 'express';
import {
  placeOrder,
  scheduleOrder,
  orderConfirmation,
  getAllOrders,
  getOrderDetails,
  getOrderTracking,
  postQrCode,
  rateOrder,
  reorder
} from '../controllers/order.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/place', authenticate, placeOrder);
// router.post('/schedule', authenticate, scheduleOrder);
// router.post('/confirmation', authenticate, orderConfirmation);

// ✅ New APIs

router.get('/getorder', authenticate, getAllOrders);
//not testet
router.get('/:order_id', authenticate, getOrderDetails);
router.get('/:order_id/track', authenticate, getOrderTracking);


router.post('/:order_id/qr', authenticate, postQrCode);
router.post('/:order_id/rate', authenticate, rateOrder);
router.post('/reorder', authenticate, reorder);

export default router;
