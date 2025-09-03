import express from 'express';
import { addNewCard , getPaymentMethods } from '../controllers/payment.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();
router.get('/get-method', authenticate, getPaymentMethods);
router.post('/add-card', authenticate, addNewCard);

export default router;
