import fs from 'fs';
import path from 'path';
import { Payment } from '../models/paymentModel.js';
import User from '../models/userModel.js';
import { razorpay } from '../server.js';
import createError from '../utils/error.js';
import crypto from 'crypto';
import sendMail from '../utils/sendMail.js';
import { generateReceiptPDF } from '../utils/generateReceiptPDF.js';


const PURCHASE_AMOUNT = 999; // ₹999

// ✅ 1. GET Razorpay Public Key
export const getRazorpayKey = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Razorpay public key fetched",
      key: process.env.RAZORPAY_API_KEY,
    });
  } catch (err) {
    return next(createError(500, "Unable to fetch Razorpay Key"));
  }
};

// ✅ 2. CREATE Razorpay Order (One-Time Purchase)
export const buyCourse = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(createError(404, "User not found"));
    if (user.role === 'ADMIN') return next(createError(403, "Admins cannot purchase courses"));
    if (user.access?.valid) return next(createError(400, "You already have access"));

    const amount = PURCHASE_AMOUNT * 100; // ₹ to paise

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    });

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (err) {
    return next(createError(500, "Failed to create Razorpay order"));
  }
};

// ✅ 3. VERIFY Razorpay Payment (One-Time)
export const verifyCoursePayment = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(createError(404, "User not found"));

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return next(createError(400, "Missing payment verification fields"));
    }

    // HMAC verification
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_API_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return next(createError(400, "Invalid signature, payment verification failed"));
    }

    // Prevent duplicate
    const alreadyExists = await Payment.findOne({ payment_id: razorpay_payment_id });
    if (alreadyExists) {
      return next(createError(409, "Payment already verified"));
    }

    // Save payment
    await Payment.create({
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      razorpay_signature,
      user: user._id,
    });

    // Grant user course access
    user.access = {
      valid: true,
      purchasedAt: new Date(),
    };
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified. Course access granted.",
    });
  } catch (err) {
    return next(createError(500, "Failed to verify payment"));
  }
};

// ✅ 4. CANCEL PURCHASE + REFUND (within 14 days)
export const cancelPurchase = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.access?.valid) {
      return next(createError(400, "No active course purchase found"));
    }

    const latestPayment = await Payment.findOne({ user: user._id }).sort({ createdAt: -1 });

    // Graceful fallback if user has access but no payment record
    if (!latestPayment) {
      console.warn(`⚠️ User ${user.email} has access but no payment found. Revoking access without refund.`);
      user.access = { valid: false, purchasedAt: null };
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Access revoked. No payment found to refund.",
      });
    }

    // Check refund window (14 days)
    const refundWindow = 14 * 24 * 60 * 60 * 1000;
    const timeElapsed = Date.now() - new Date(latestPayment.createdAt).getTime();

    if (timeElapsed > refundWindow) {
      return res.status(400).json({
        success: false,
        message: "Refund window expired (14 days)",
      });
    }

    // Attempt Razorpay refund
    const refund = await razorpay.payments.refund(latestPayment.payment_id);
    if (refund.status !== 'processed') {
      return next(createError(500, "Refund failed via Razorpay"));
    }

    // Revoke access & delete payment record
    user.access = { valid: false, purchasedAt: null };
    await user.save();
    await latestPayment.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Purchase refunded and access revoked",
    });
  } catch (err) {
    console.error("❌ Refund error:", err);
    return next(createError(500, "Refund process failed"));
  }
};

// ✅ 5. ADMIN: GET ALL PAYMENTS + CHART DATA
export const allPayments = async (req, res, next) => {
  try {
    const { count = 100, skip = 0 } = req.query;

    const payments = await Payment.find()
    .populate('user', 'email name') // 👈 populate email & name
      .sort({ createdAt: -1 })
      .limit(Number(count))
      .skip(Number(skip));

    const purchasesMade = payments.length;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const monthlyStats = Object.fromEntries(monthNames.map(month => [month, 0]));

    payments.forEach(p => {
      const month = monthNames[new Date(p.createdAt).getMonth()];
      monthlyStats[month]++;
    });

    const paidUsers = await User.find({ 'access.valid': true });

    return res.status(200).json({
      success: true,
      message: 'Payment stats fetched successfully',
      payments,
      purchasesMade,
      paidUserCount: paidUsers.length,
      totalRevenue: purchasesMade * PURCHASE_AMOUNT,
      monthlyBreakdown: monthlyStats,
      monthlySalesRecord: Object.values(monthlyStats),
    });
  } catch (err) {
    return next(createError(500, "Failed to fetch payment stats"));
  }
};
// ✅ Manual: Send Email Receipt + Save PDF
export const sendReceiptEmail = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId).populate('user');
    if (!payment) return next(createError(404, 'Payment not found'));

    const user = payment.user;
    const date = new Date(payment.createdAt).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const emailHTML = `
      <!DOCTYPE html>
      <html lang="en"><head><meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Smart LMS - Payment Receipt</title>
      <style>
        body {
          font-family: 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #f0f4ff, #dbeafe);
          margin: 0; padding: 0;
        }
        .email-wrapper {
          max-width: 600px;
          margin: 30px auto;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .email-header {
          background-color: #1a73e8;
          color: white;
          text-align: center;
          padding: 20px 0;
          font-size: 24px;
          font-weight: bold;
          letter-spacing: 1px;
        }
        .email-body {
          padding: 30px 25px;
          background-image: url('https://www.transparenttextures.com/patterns/cubes.png');
          background-color: rgba(255, 255, 255, 0.8);
        }
        .email-body h2 {
          color: #1a73e8;
          font-size: 22px;
          margin-bottom: 20px;
        }
        .receipt-box {
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid #ccc;
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
        }
        .receipt-box p {
          margin: 8px 0;
          font-size: 15px;
          color: #333;
        }
        .receipt-box strong {
          color: #111;
        }
        .email-footer {
          background-color: #f3f4f6;
          text-align: center;
          padding: 20px;
          font-size: 13px;
          color: #6b7280;
        }
      </style></head><body>
        <div class="email-wrapper">
          <div class="email-header">SMART LMS</div>
          <div class="email-body">
            <h2>🧾 Payment Receipt</h2>
            <p>Dear <strong>${user.name}</strong>,</p>
            <p>Thank you for choosing the <strong>SMART LMS Portal</strong>. We're thrilled to have you onboard!</p>
            <div class="receipt-box">
              <p><strong>Payment ID:</strong> ${payment.payment_id}</p>
              <p><strong>Order ID:</strong> ${payment.order_id}</p>
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Amount:</strong> ₹999</p>
              <p><strong>Mode of Payment:</strong> Razorpay Gateway</p>
              <p><strong>Status:</strong> ${user.access?.valid ? 'Active' : 'Inactive'}</p>
            </div>
          </div>
          <div class="email-footer">
            &copy; ${new Date().getFullYear()} SMART LMS. All rights reserved.<br />
            Contact: admin.smartlms@gmail.com
          </div>
        </div>
      </body></html>`;

    // ✅ Generate PDF
    const pdfBuffer = await generateReceiptPDF({
      user: {
        name: user.name,
        email: user.email,
        status: user.access?.valid ? 'Active' : 'Inactive',
      },
      payment: {
        payment_id: payment.payment_id,
        order_id: payment.order_id,
        createdAt: payment.createdAt,
        amount: 999,
      },
    });

// ✅ Save to /uploads/receipts/ using Razorpay payment_id
const filename = `${payment.payment_id}.pdf`; // <- Correct filename
const receiptPath = path.join(process.cwd(), 'uploads', 'receipts');
if (!fs.existsSync(receiptPath)) fs.mkdirSync(receiptPath, { recursive: true });

fs.writeFileSync(path.join(receiptPath, filename), pdfBuffer);
    // ✅ Email with attached PDF
    await sendMail(
      `SMART LMS <${process.env.GMAIL_ID}>`,
      user.email,
      '🧾 Your SMART LMS Payment Receipt',
      emailHTML,
      pdfBuffer
    );

    return res.status(200).json({
      success: true,
      message: 'Receipt emailed and stored successfully',
    });
  } catch (err) {
    console.error('❌ Email Send Failed:', err);
    return next(createError(500, 'Failed to send receipt email'));
  }
};