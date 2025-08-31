import express from "express";
import multer from "multer";
import {
  createProctorSession,
  endProctorSession,
  logViolation,
  logProctorAction,
  getExamReport,
  getStudentViolations,
  getProctorSessions,
} from "../controller/proctorController.js";

import { isLoggedIn, authorizedRole, isStudent } from "../middleware/authMiddleware.js";

const router = express.Router();

// ================= MULTER SETUP =================
// Store snapshots in memory (can later save to cloud or disk)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ================= INSTRUCTOR/ADMIN ROUTES =================

// Create a live proctoring session
// POST /api/v1/proctor/session
router.post(
  "/session",
  isLoggedIn,
  isStudent,
  authorizedRole("INSTRUCTOR", "ADMIN"),
  createProctorSession
);

// End a proctor session
// PUT /api/v1/proctor/session/:sessionId/end
router.put(
  "/session/:sessionId/end",
  isLoggedIn,
  authorizedRole("INSTRUCTOR", "ADMIN"),
  endProctorSession
);

// Log manual proctor action (e.g., warning a student)
// POST /api/v1/proctor/session/:sessionId/action
router.post(
  "/session/:sessionId/action",
  isLoggedIn,
  authorizedRole("INSTRUCTOR", "ADMIN"),
  logProctorAction
);

// Get all proctor sessions (instructor can see own, admin sees all)
// GET /api/v1/proctor/sessions
router.get(
  "/sessions",
  isLoggedIn,
  authorizedRole("INSTRUCTOR", "ADMIN"),
  getProctorSessions
);

// ================= AI / STUDENT ROUTES =================

// Log AI-detected violation (snapshot/image upload optional)
// POST /api/v1/proctor/session/:sessionId/violation
router.post(
  "/session/:sessionId/violation",
  isLoggedIn,
  upload.single("snapshot"), // optional AI snapshot
  logViolation
);

// ================= ADMIN ROUTES =================

// Get full exam report with violations and manual logs
// GET /api/v1/proctor/report/:examSessionId
router.get(
  "/report/:examSessionId",
  isLoggedIn,
  authorizedRole("ADMIN"),
  getExamReport
);

// Get all violations of a specific student
// GET /api/v1/proctor/student/:studentId/violations
router.get(
  "/student/:studentId/violations",
  isLoggedIn,
  authorizedRole("ADMIN"),
  getStudentViolations
);

export default router;
