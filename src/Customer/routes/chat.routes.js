// routes/chat.routes.js
import express from 'express';
import {
  sendMessage,
  getInboxThreads,
  getThreadMessages,
  markThreadAsRead
} from '../controllers/chat.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/send', authenticate, sendMessage);
router.get('/threads', authenticate, getInboxThreads);
router.get('/messages', authenticate, getThreadMessages);
router.post('/mark-read', authenticate, markThreadAsRead);

export default router;
