
// routes/hero.routes.js
import express from 'express';
import {
  //registerHero,
 // loginHero,
  //logoutHero,
  // getHeroProfile,
  //updateHeroProfile,
  createOrUpdateHeroProfile,
  updateHeroProfileById,
  setupHeroProfile,
  changeHeroPassword,
  postFoodService,
  postGigService,
  updateHeroService,
  deleteHeroService,
  listHeroServices,
  getHeroOrders,
  getHeroOrderDetails,
  acceptHeroOrder,
  rejectHeroOrder,
  updateHeroOrderStatus,
  getOrderMessages,
  sendOrderMessage,
  getHeroDashboard,
  getHeroHistory,
  getHeroReviews,
  createNonFoodService,
  getMyServices,
  getMyServiceById,
  updateMyService,
  deleteMyService,
  getHeroProfileStatus,
  createCategory,
  getCategoriesWithServices,
  getAllCategories,
  getServicesByCategoryName
} from '../controllers/Hhero.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { serviceUpload } from '../../middlewares/handlemedia.js';
import { upload } from '../../utils/multerConfig.js';
const router = express.Router();



// Auth
// router.post('/auth/register-hero', registerHero);
// router.post('/auth/login', loginHero);
// router.post('/auth/logout', authenticate, logoutHero);
// //
// router.post('/update-profile', authenticate, serviceUpload,  updateHeroProfile);
// router.post('/profile-setup',authenticate, serviceUpload, setupHeroProfile);

router.post('/profile', authenticate, upload.single('profile_picture'), createOrUpdateHeroProfile);

//router.get('/profile', authenticate, getHeroProfile);

router.put('/profile/:hero_id', authenticate, upload.single('profile_picture'), updateHeroProfileById);

router.post('/profile/setup', authenticate, upload.array('documents'), setupHeroProfile);
router.get("/profile/status", authenticate, getHeroProfileStatus);


// router.get('/get-profile', authenticate, getHeroProfile);
//router.put('/update-profile', authenticate, updateHeroProfile);
// router.post('/change-password', authenticate, changeHeroPassword);

// Services
router.post('/food-service', authenticate, serviceUpload, postFoodService);
router.post('/gig-service', authenticate, serviceUpload, postGigService);

// Non-food service CRUD (multi-vendor)
router.post('/non-food-service', authenticate, createNonFoodService);
router.get('/services', authenticate, getMyServices);
router.get('/services/:id', authenticate, getMyServiceById);
router.put('/services/:id', authenticate, updateMyService);
router.delete('/services/:id', authenticate, deleteMyService);

// Category management
router.post('/category', authenticate, createCategory);
router.get('/categories-with-services', getCategoriesWithServices);
router.get('/categories', getAllCategories);
router.get('/category/:name/services', getServicesByCategoryName);

// router.put('/services/:id', authenticate, updateHeroService);
// router.delete('/services/:id', authenticate, deleteHeroService);
// router.get('/services', authenticate, listHeroServices);


// Orders/Bookings
// router.get('/orders', authenticate, getHeroOrders);
// router.get('/orders/:id', authenticate, getHeroOrderDetails);
// router.post('/orders/:id/accept', authenticate, acceptHeroOrder);
// router.post('/orders/:id/reject', authenticate, rejectHeroOrder);
// router.patch('/orders/:id/status', authenticate, updateHeroOrderStatus);

// // Messaging
// router.get('/messages/:orderId', authenticate, getOrderMessages);
// router.post('/messages/:orderId', authenticate, sendOrderMessage);

// // Dashboard, history, reviews
// router.get('/dashboard', authenticate, getHeroDashboard);
// router.get('/history', authenticate, getHeroHistory);
// router.get('/reviews', authenticate, getHeroReviews);


export default router;
