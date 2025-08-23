// routes/examRoutes.js
import express from "express";
import {
  createExamRequest,
  getExamRequestStatus,
  approveExamRequest,
  rejectExamRequest,
  getPendingExamRequests,
  verifyExamCode
} from "../controller/examController.js";

import { isLoggedIn, isStudent, isInstructor, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ================= STUDENT ROUTES =================
// Submit a new exam request
router.post("/request", isLoggedIn, isStudent, createExamRequest);

// Get current exam request status
router.get("/request/status", isLoggedIn, isStudent, getExamRequestStatus);

// Verify exam code (new route)
router.post("/verify-code", isLoggedIn, isStudent, verifyExamCode);

// ================= INSTRUCTOR/ADMIN ROUTES =================
// Get all pending requests for courses the user manages (or all for admin)
router.get("/request/pending", isLoggedIn, isInstructor, getPendingExamRequests);
router.get("/request/pending-admin", isLoggedIn, isAdmin, getPendingExamRequests);

// Approve an exam request
router.put("/request/approve/:requestId", isLoggedIn, isInstructor, approveExamRequest);
router.put("/request/approve-admin/:requestId", isLoggedIn, isAdmin, approveExamRequest);

// Reject an exam request
router.put("/request/reject/:requestId", isLoggedIn, isInstructor, rejectExamRequest);
router.put("/request/reject-admin/:requestId", isLoggedIn, isAdmin, rejectExamRequest);

export default router;
