import express from 'express';
import { postNewTask,cancelTask, getUserTasks, getTaskOffers, payForTask } from '../controllers/task.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { serviceUpload } from '../../middlewares/handlemedia.js';
const router = express.Router();

router.post('/addtask', authenticate, serviceUpload, postNewTask);
router.post('/:task_id/cancel', authenticate, cancelTask);
router.get('/user-posted', authenticate, getUserTasks);
router.get('/:task_id/offers', authenticate, getTaskOffers);
router.post('/offer/pay', authenticate, payForTask);

export default router;
