import { Router } from 'express';
import {
  getRazorpayKey,
  buyCourse,
  verifyCoursePayment,
  cancelPurchase,
  allPayments,
  sendReceiptEmail, // 👈 new controller
} from '../controller/paymentController.js';

import { isLoggedIn, authorizedRole } from '../middleware/authMiddleware.js';

const router = Router();

// 🔐 Admin Route: Payment Dashboard (All Payments)
router.get('/', isLoggedIn, authorizedRole('ADMIN'), allPayments);

// 🔑 Step 1: Get Razorpay Public Key
router.get('/key', isLoggedIn, getRazorpayKey);

// 💸 Step 2: Create Razorpay Order (One-Time)
router.post('/buy', isLoggedIn, buyCourse);

// ✅ Step 3: Verify Payment After Success
router.post('/verify', isLoggedIn, verifyCoursePayment);

// ❌ Step 4: Cancel & Refund (within 14 days)
router.post('/cancel', isLoggedIn, cancelPurchase);

// 📩 Step 5: Admin - Send Receipt via Email
router.post('/send-receipt/:paymentId', isLoggedIn, authorizedRole('ADMIN'), sendReceiptEmail);
// router.get('/receipts/:filename', isLoggedIn, authorizedRole('ADMIN'), viewReceiptPDF);

export default router;
