import { Router } from 'express';
import {
  addLecturesToCourse,
  createCourse,
  deleteCourse,
  deleteLectures,
  getAllCourses,
  getLectures,
  updateCourse,
  updateLectures,
  // getInstructorCourses
} from '../controller/courseController.js';
import { authorizedRole, isLoggedIn, verifySubscription } from "../middleware/authMiddleware.js";
import upload from '../middleware/multer.js';

const router = Router();

// Courses
router.get("/", getAllCourses);

// Create Course: ADMIN or INSTRUCTOR
router.post(
  "/newcourse",
  isLoggedIn,
  authorizedRole('ADMIN', 'INSTRUCTOR'),
  upload.single("thumbnail"),
  createCourse
);

// Update Course: ADMIN or course owner (INSTRUCTOR)
router.put(
  "/:id",
  isLoggedIn,
  authorizedRole('ADMIN', 'INSTRUCTOR'),
  upload.single("thumbnail"),
  updateCourse
);

// Delete Course: ADMIN or course owner (INSTRUCTOR)
router.delete(
  "/:id",
  isLoggedIn,
  authorizedRole('ADMIN', 'INSTRUCTOR'),
  deleteCourse
);

// Lectures
router.get("/:id/lectures", isLoggedIn, verifySubscription, getLectures);

// Add Lecture: ADMIN or course owner (INSTRUCTOR)
router.post(
  "/:id/lectures",
  isLoggedIn,
  authorizedRole('ADMIN', 'INSTRUCTOR'),
  upload.single("lecture"),
  addLecturesToCourse
);

// Update Lecture: ADMIN or course owner (INSTRUCTOR)
router.put(
  "/lectures/:id/:lectureId",
  isLoggedIn,
  authorizedRole('ADMIN', 'INSTRUCTOR'),
  upload.single("lecture"),
  updateLectures
);

// Delete Lecture: ADMIN or course owner (INSTRUCTOR)
router.delete(
  "/lectures/:id/:lectureId",
  isLoggedIn,
  authorizedRole('ADMIN', 'INSTRUCTOR'),
  deleteLectures
);
// seperate route to fetch the individual instructor courses
// router.get(
//   '/instructor/my-courses',
//   isLoggedIn,
//   authorizedRole('INSTRUCTOR'),
//   getInstructorCourses
// );
export default router;
