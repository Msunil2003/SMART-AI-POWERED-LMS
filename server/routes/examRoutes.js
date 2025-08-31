// routes/examRoutes.js
import express from "express";
import multer from "multer";
import {
  createExamRequest,
  getExamRequestStatus,
  approveExamRequest,
  rejectExamRequest,
  getPendingExamRequests,
  verifyExamCode,
  startExamSession,
  getSessionStatus,
  getInstructorCourses,
  createExamSet,
  getSetsForCourse,
  getStudentsForCourse,
  assignSetToStudents,
  assignSetRandomToAll,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionsBySet,
  markExamSetReady, 
  // getAssignedStudents,
  // getApprovedExamRequests,
  getEnrolledStudentsWithApprovedRequests,
  assignStudentsToSet,
  getAssignedStudents,
  verifyFaceSession,
 getExamSessionDetailsByCode,

} from "../controller/examController.js";

import {
  isLoggedIn,
  isStudent,
  authorizedRole,
  isInstructor,
  isAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ================= MULTER SETUP =================
const storage = multer.memoryStorage(); // files in memory
const upload = multer({ storage });

// ================= STUDENT ROUTES =================
router.post("/request", isLoggedIn, isStudent, createExamRequest);
router.get("/request/status", isLoggedIn, isStudent, getExamRequestStatus);
router.post("/verify-code", isLoggedIn, isStudent, verifyExamCode);

// ================= INSTRUCTOR/ADMIN ROUTES =================
router.get("/request/pending", isLoggedIn, isInstructor, getPendingExamRequests);
router.get(
  "/request/pending-admin",
  isLoggedIn,
  isAdmin,
  getPendingExamRequests
);
router.put(
  "/request/approve/:requestId",
  isLoggedIn,
  isInstructor,
  approveExamRequest
);
router.put(
  "/request/approve-admin/:requestId",
  isLoggedIn,
  isAdmin,
  approveExamRequest
);
router.put(
  "/request/reject/:requestId",
  isLoggedIn,
  isInstructor,
  rejectExamRequest
);
router.put(
  "/request/reject-admin/:requestId",
  isLoggedIn,
  isAdmin,
  rejectExamRequest
);

// ================= START EXAM SESSION =================
router.post(
  "/start-session",
  isLoggedIn,
  isStudent,
  upload.single("faceSnapshot"), // student face snapshot
  startExamSession
);
router.get("/session-status", isLoggedIn, isStudent, getSessionStatus);

// ================= INSTRUCTOR COURSES =================
router.get(
  "/instructor/my-courses",
  isLoggedIn,
  authorizedRole("INSTRUCTOR", "ADMIN"),
  getInstructorCourses
);

// ================= EXAM SETS =================
router.post(
  "/sets",
  isLoggedIn,
  authorizedRole("INSTRUCTOR", "ADMIN"),
  createExamSet
);

router.get(
  "/course/:courseId/sets",
  isLoggedIn,
  authorizedRole("INSTRUCTOR", "ADMIN"),
  getSetsForCourse
);

// ================= STUDENTS & ASSIGNMENTS =================
router.get(
  "/course/:courseId/students",
  isLoggedIn,
  authorizedRole("INSTRUCTOR", "ADMIN"),
  getStudentsForCourse
);

router.post(
  "/sets/:setId/assign",
  isLoggedIn,
  authorizedRole("INSTRUCTOR", "ADMIN"),
  assignSetToStudents
);

router.post(
  "/sets/:setId/assign-random",
  isLoggedIn,
  authorizedRole("INSTRUCTOR", "ADMIN"),
  assignSetRandomToAll
);

// ================= QUESTIONS =================
// Add a question to a set
router.post(
  "/questions/:setId",
  isLoggedIn,
  authorizedRole("INSTRUCTOR", "ADMIN"),
  upload.single("media"), // file upload for question
  addQuestion
);

// Update a question
router.patch(
  "/questions/:setId/:questionId",
  isLoggedIn,
  authorizedRole("INSTRUCTOR", "ADMIN"),
  upload.single("media"),
  updateQuestion
);

// Delete a question
router.delete(
  "/questions/:setId/:questionId",
  isLoggedIn,
  authorizedRole("INSTRUCTOR", "ADMIN"),
  deleteQuestion
);

// Get all questions for a set
router.get(
  "/questions/set/:setId",
  isLoggedIn,
  authorizedRole("INSTRUCTOR", "ADMIN"),
  getQuestionsBySet
);

// PATCH /api/v1/exam/sets/:setId/ready
router.patch("/sets/:setId/ready",  isLoggedIn,
  authorizedRole("INSTRUCTOR", "ADMIN"), markExamSetReady);

  
// // Get all assigned students for an exam set
// router.get("/:examSetId/assigned", isLoggedIn, authorizedRole("INSTRUCTOR", "ADMIN"), getAssignedStudents);

// router.get(
//   "/course/:courseId/approved-requests",
//   isLoggedIn,
//   authorizedRole("INSTRUCTOR", "ADMIN"),
//   getApprovedExamRequests
// );

router.get(
  "/course/:courseId/enrolled-with-approved",
  isLoggedIn,
  authorizedRole("INSTRUCTOR", "ADMIN"),
  getEnrolledStudentsWithApprovedRequests
);

// 2️⃣ Assign selected students to an exam set
// POST /api/v1/exam/sets/:setId/assign
router.post(
  "/sets/:setId/assigned",
  isLoggedIn,
  authorizedRole("INSTRUCTOR", "ADMIN"),
  assignStudentsToSet
);

router.get(
  "/sets/:setId/assignments",
  isLoggedIn,
  authorizedRole("INSTRUCTOR", "ADMIN"),
  getAssignedStudents
);

router.post("/verify-face/:sessionId", upload.single("faceSnapshot"), isLoggedIn,isStudent, verifyFaceSession);

router.get("/session-details/:examCode", isLoggedIn,isStudent,  getExamSessionDetailsByCode);

export default router;
