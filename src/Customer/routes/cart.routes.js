import express from 'express';
import {
  addToCart,
  getCart,
  updateCart,
  removeCart,
  applyVoucherCode
} from '../controllers/cart.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/add', authenticate, addToCart);
router.get('/getcart', authenticate, getCart);
router.put('/update', authenticate, updateCart);
router.delete('/:item_id', authenticate, removeCart);
router.post('/apply-voucher', authenticate, applyVoucherCode);

export default router;
