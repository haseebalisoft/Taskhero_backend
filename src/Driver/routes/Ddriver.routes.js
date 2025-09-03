import express from 'express';
import {
  registerDriver,
  loginDriver,
  profile,
  addpaymentmethod,
  vehicledetails,
  vehicledocuments,
  viewTasks,
  viewTaskDetail,
  acceptTask,
  rejectTask,
  updateTaskStatus,
  trackTask,
  getDriverProfile,
  updateDriverProfile,
  getChatMessages,
  sendChatMessage,
  getNotifications,
  markNotificationsRead
} from '../controller/Ddriver.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { serviceUpload } from '../../middlewares/handlemedia.js';
const router = express.Router();

router.post('/auth/register-driver',  registerDriver);
router.post('/auth/login', loginDriver);
router.post('/profile', authenticate, serviceUpload, profile);
router.post('/addpaymentmethod', authenticate,addpaymentmethod);
router.post('/vehicledetails',authenticate, serviceUpload, vehicledetails);
router.post('/vehicledocuments', authenticate,serviceUpload, vehicledocuments);

router.get('/tasks', authenticate, viewTasks);
router.get('/tasks/:id', authenticate, viewTaskDetail);
router.post('/tasks/:id/accept', authenticate, acceptTask);
router.post('/tasks/:id/reject', authenticate, rejectTask);
router.patch('/tasks/:id/status', authenticate, updateTaskStatus);
router.get('/tasks/:id/track', authenticate, trackTask);

router.get('/profile', authenticate, getDriverProfile);
router.put('/profile', authenticate, updateDriverProfile);

router.get('/messages/:orderId', authenticate, getChatMessages);
router.post('/messages/:orderId', authenticate, sendChatMessage);

router.get('/notifications', authenticate, getNotifications);
router.post('/notifications/mark-read', authenticate, markNotificationsRead);

export default router;
