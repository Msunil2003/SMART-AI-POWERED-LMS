// controllers/examController.js
import asyncHandler from "express-async-handler";
import ExamRequest from "../models/examRequestModel.js";
import User from "../models/userModel.js";
import Course from "../models/courseModel.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import sendMail from "../utils/sendMail.js";
import ExamSession from "../models/ExamSession.js";
import mongoose from "mongoose";
import ExamSet from "../models/ExamSet.js";

import Question from "../models/Question.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import AssignedExam from "../models/AssignedExam.js";
// Instead of default import
import { compareFaces } from "../../client/src/helpers/faceRecognition.js";

// ================= CREATE EXAM REQUEST =================
export const createExamRequest = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { courseId } = req.body; // get courseId from frontend

  if (!courseId) {
    return res.status(400).json({ success: false, message: "Course ID is required" });
  }

  // Check if request already exists for this user & course
  const existing = await ExamRequest.findOne({ user: userId, course: courseId });
  if (existing) {
    return res.status(400).json({ success: false, message: "You have already requested this exam" });
  }

  // Create new exam request
  const newRequest = await ExamRequest.create({
    user: userId,
    course: courseId, // stored in the model
  });

  res.status(201).json({
    success: true,
    message: "Exam request submitted successfully!",
    data: newRequest,
  });
});

// ================= GET EXAM REQUEST STATUS =================
// controllers/examController.js
export const getExamRequestStatus = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { courseId } = req.query;
  if (!courseId) throw new ApiError(400, "Course ID is required");

  // Find the exam request for this user and this course
  const request = await ExamRequest.findOne({ user: userId, course: courseId }).populate(
    "course",
    "title"
  );

  if (!request) {
    return res.status(200).json(
      new ApiResponse(
        200,
        null,
        "No exam request found for this course",
        true
      )
    );
  }

  // Only send status and course info, no examCode
  const responseData = {
    status: request.status,
    courseTitle: request.course?.title || "N/A",
  };

  res.status(200).json(
    new ApiResponse(
      200,
      { data: responseData },
      "Exam request status fetched successfully",
      true
    )
  );
});

// ================= Get Pending Exam Requests =================
export const getPendingExamRequests = asyncHandler(async (req, res) => {
  const user = req.user;

  let filter = { status: "pending" }; // Only pending requests

  if (user.role === "INSTRUCTOR") {
    // Get courses created by this instructor
    const courses = await Course.find({ "createdBy.id": user._id }).select("_id");
    const courseIds = courses.map((c) => c._id);

    // Filter exam requests to only those courses
    filter.course = { $in: courseIds };
  }
  // ADMIN: no filter, gets all pending requests

  // Populate user and course details
  const requests = await ExamRequest.find(filter)
    .populate("user", "name email role")
    .populate("course", "title createdBy");

  res.status(200).json({
    success: true,
    status: 200,
    message: "Pending exam requests fetched successfully",
    data: requests,
  });
});


// ================= APPROVE EXAM REQUEST =================
export const approveExamRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;

  // Find exam request with course populated
  const request = await ExamRequest.findById(requestId).populate("course");
  if (!request) throw new ApiError(404, "Request not found");
  if (request.status === "approved") throw new ApiError(400, "Request already approved");

  // Check authorization: only admin or course creator
  const courseCreatorId = request.course.createdBy?.id || request.course.createdBy;
  if (req.user.role !== "ADMIN" && String(courseCreatorId) !== String(req.user._id)) {
    throw new ApiError(403, "You are not authorized to approve this request");
  }

  // Generate secure 6-character exam code (alphanumeric only)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let examCode = "";
  for (let i = 0; i < 6; i++) {
    examCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  request.status = "approved";
  request.examCode = examCode;
  await request.save();

  // Fetch user details
  const user = await User.findById(request.user);

  // Build dynamic exam registration link (backend only)
  const registerLink = `${process.env.FRONTEND_URL}/exam/${request.exam}/register?code=${examCode}`;

  // Modern styled email WITHOUT "Go to Exam Portal" button
  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 12px; border:1px solid #e5e7eb;">
        
        <h2 style="text-align: center; color: #1f2937; margin-bottom: 10px;">
          🎓 Exam Request Approved
        </h2>
        <p style="text-align: center; color: #6b7280; font-size: 15px; margin-bottom: 30px;">
          Hello <strong>${user.name}</strong>, your exam request has been approved! 🎉
        </p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align:center; margin-bottom: 25px;">
          <p style="font-size: 16px; margin: 0; color:#374151;">Course:</p>
          <p style="font-size: 18px; font-weight: bold; margin: 4px 0; color:#111827;">${request.course.title}</p>
          
          <p style="font-size: 16px; margin: 15px 0 5px; color:#374151;">Your Exam Code:</p>
          <div style="display:inline-block; background:#2563eb; color:#fff; padding:12px 20px; border-radius:6px; font-size:20px; font-weight:bold; letter-spacing:2px;">
            ${examCode}
          </div>
        </div>
        
        <p style="color:#374151; font-size:15px; line-height:1.6;">
          Please keep this code safe. You will need it to register and start your exam session.
          If you face any issues, contact our support team at 
          <a href="mailto:admin.smartlms@gmail.com" style="color:#2563eb;">admin.smartlms@gmail.com</a>.
        </p>

        <p style="margin-top: 30px; font-size: 13px; text-align:center; color:#9ca3af;">
          This is an automated email from <strong>Smart LMS</strong>. Please do not reply.
        </p>
      </div>
    </div>
  `;

  // Send the email
  await sendMail(
    `SMART LMS <${process.env.GMAIL_ID}>`,
    user.email,
    "Your Exam Code - Smart LMS",
    htmlMessage
  );

  res
    .status(200)
    .json(new ApiResponse(200, { examCode, registerLink }, "Exam request approved"));
});



export const verifyExamCode = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  let { courseId, examCode } = req.body;
  if (!courseId || !examCode) {
    throw new ApiError(400, "Course ID and Exam Code are required");
  }

  // ✅ Decode exam code to handle %23 (for #), %20 (spaces), etc.
  examCode = decodeURIComponent(examCode);

  // Find the approved exam request for this user and course
  const request = await ExamRequest.findOne({
    user: userId,
    course: courseId,
    status: "approved",
  });

  if (!request) {
    throw new ApiError(404, "No approved exam request found for this course");
  }

  // Check if exam code matches
  if (request.examCode !== examCode) {
    return res.status(400).json(
      new ApiResponse(400, null, "❌ Incorrect exam code for this course")
    );
  }

  // ✅ Check if a session already exists
  let session = await ExamSession.findOne({
    studentId: userId,
    examCode,
  });

  if (!session) {
    // ✅ Create new session, strictly pendingVerification
    session = await ExamSession.create({
      studentId: userId,
      examId: request._id,
      examCode,
      status: "pendingVerification", // must be verified by AI face model
    });
  }

  // ✅ Respond with session info
  res.status(200).json(
    new ApiResponse(
      200,
      {
        courseId,
        examCode,
        sessionId: session._id,
        status: session.status, // pendingVerification
      },
      "✅ Exam code verified. Complete AI face verification to start the exam."
    )
  );
});


// ================= REJECT EXAM REQUEST =================
export const rejectExamRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;

  const request = await ExamRequest.findById(requestId).populate("course");
  if (!request) throw new ApiError(404, "Request not found");
  if (request.status === "rejected") throw new ApiError(400, "Request already rejected");

  // Check authorization
  const courseCreatorId = request.course.createdBy?.id || request.course.createdBy;
  if (req.user.role !== "ADMIN" && String(courseCreatorId) !== String(req.user._id)) {
    throw new ApiError(403, "You are not authorized to reject this request");
  }

  request.status = "rejected";
  await request.save();

  res.status(200).json(new ApiResponse(200, null, "Exam request rejected"));
});


// ================= EXAM START PRE-VERIFICATION =================
// POST /api/v1/exam/start-session



export const startExamSession = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }
    const studentId = req.user._id;

    // Extract fields from request
    let { examCode, ipAddress, deviceInfo } = req.body;
    examCode = decodeURIComponent(examCode);

    // Validate exam
    const examRequest = await ExamRequest.findOne({ examCode, status: "approved" });
    if (!examRequest) {
      return res.status(404).json({ success: false, message: "Invalid exam code." });
    }

    // Check existing session
    let session = await ExamSession.findOne({ studentId, examCode });

    if (session) {
      // Session already exists, return existing data
      await session.populate([
        { path: "examId", select: "code types durationMinutes setLabel startDate endDate" },
        { path: "studentId", select: "name email" },
      ]);

      return res.status(200).json({
        success: true,
        message: "Exam session already exists.",
        data: {
          sessionId: session._id,
          sessionStatus: session.status,
          faceSnapshot: session.faceSnapshot || null, // may already have snapshot
          exam: session.examId,
          user: session.studentId,
        },
        alreadyRegistered: true,
      });
    }

    // No session exists, require faceSnapshot to create new session
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Photo required to start session." });
    }

    // Convert file buffer to Base64
    const faceSnapshot = req.file.buffer.toString("base64");

    // Create new session
    const newSession = new ExamSession({
      studentId,
      examId: examRequest._id,
      examCode,
      ipAddress,
      deviceInfo,
      faceSnapshot,
      status: "pendingVerification",
      startTime: new Date(),
    });

    await newSession.save();

    // Populate for frontend
    await newSession.populate([
      { path: "examId", select: "code types durationMinutes setLabel startDate endDate" },
      { path: "studentId", select: "name email" },
    ]);

    return res.status(200).json({
      success: true,
      message: "Exam session created successfully.",
      data: {
        sessionId: newSession._id,
        sessionStatus: newSession.status,
        faceSnapshot: newSession.faceSnapshot,
        exam: newSession.examId,
        user: newSession.studentId,
      },
      alreadyRegistered: false,
    });
  } catch (err) {
    console.error("Start Exam Error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};


// GET /api/v1/exam/session-status?examCode=ABC
export const getSessionStatus = async (req, res) => {
  try {
    const studentId = req.user?._id;
    let { examCode } = req.query;

    if (!studentId || !examCode) {
      return res.status(400).json({
        success: false,
        message: "Missing studentId or examCode",
      });
    }

    examCode = decodeURIComponent(examCode);

    const existingSession = await ExamSession.findOne({
      studentId,
      examCode,
    }).lean();

    if (existingSession) {
      return res.status(200).json({
        success: true,
        data: {
          alreadyRegistered: true,
          status: existingSession.status,
          _id: existingSession._id,
        },
      });
    }

    return res
      .status(200)
      .json({ success: true, data: { alreadyRegistered: false } });
  } catch (err) {
    console.error("Session Status Error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};






/**
 * GET instructor's courses
 * GET /api/v1/instructor/my-courses
 */
export const getInstructorCourses = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;

  // Allow both ADMIN and INSTRUCTOR
  if (userRole !== "INSTRUCTOR" && userRole !== "ADMIN") {
    return res.status(403).json({
      success: false,
      status: 403,
      message: "You do not have permission",
    });
  }

  let courses;

  if (userRole === "ADMIN") {
    // Admin can see all courses
    courses = await Course.find()
      .select("title description status createdBy")
      .populate("createdBy.id", "name email role");
  } else {
    // Instructor: only see their own courses
    courses = await Course.find({ "createdBy.id": userId })
      .select("title description status createdBy")
      .populate("createdBy.id", "name email role");
  }

  res.status(200).json({
    success: true,
    status: 200,
    message: "Courses fetched successfully",
    data: courses,
  });
});

/**
 * POST create a new exam set
 * POST /api/v1/examconfig/sets
 */
export const createExamSet = asyncHandler(async (req, res) => {
  const { courseId, setLabel, name, types = [], startAt, endAt, durationMinutes } = req.body;
  if (!courseId || !setLabel || !name || !types || types.length === 0) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  // verify instructor owns course
  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json({ success: false, message: "Course not found" });
  const creatorId = course.createdBy?.id || course.createdBy;
  if (String(creatorId) !== String(req.user._id) && req.user.role !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Not authorized to add sets for this course" });
  }

  const examSet = await ExamSet.create({
    courseId,
    createdBy: req.user._id,
    name,
    setLabel,
    types,
    startAt: startAt ? new Date(startAt) : undefined,
    endAt: endAt ? new Date(endAt) : undefined,
    durationMinutes: durationMinutes || 60,
  });

  res.status(201).json({ success: true, data: examSet });
});

/**
 * GET sets for a course
 * GET /api/v1/examconfig/course/:courseId/sets
 */
export const getSetsForCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  // Optionally check instructor permission
  const sets = await ExamSet.find({ courseId }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: sets });
});

/**
 * GET students enrolled in a course
 * GET /api/v1/examconfig/course/:courseId/students
 * NOTE: this relies on how you store enrollments. Here I assume Course has an array `students` with user ids.
 */

export const getStudentsForCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  if (!courseId) {
    return res.status(400).json({ success: false, message: "Course ID is required" });
  }

  try {
    // Find all enrollments for this course
    const enrollments = await CourseEnrollment.find({ "course.id": courseId })
      .populate("student.id", "name email") // populate student name & email from User collection
      .populate("course.createdBy.id", "name"); // populate instructor name from User collection

    if (!enrollments.length) {
      return res.status(404).json({ success: false, message: "No enrollments found for this course" });
    }

    // Format data
    const data = enrollments.map((enrollment) => ({
      student: enrollment.student,
      course: enrollment.course,
      enrolledAt: enrollment.enrolledAt,
    }));

    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Error fetching course enrollments:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});
/**
 * POST manual assign set to selected students
 * POST /api/v1/examconfig/sets/:setId/assign
 * body: { studentIds: [] }
 */
export const assignSetToStudents = asyncHandler(async (req, res) => {
  const { setId } = req.params;
  const { studentIds } = req.body;
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ success: false, message: "studentIds required" });
  }

  const examSet = await ExamSet.findById(setId);
  if (!examSet) return res.status(404).json({ success: false, message: "Set not found" });

  // create assignments (skip duplicates)
  const ops = [];
  for (const sid of studentIds) {
    // check duplicate
    const exists = await ExamAssignment.findOne({ examSetId: setId, studentId: sid });
    if (!exists) {
      ops.push({
        examSetId: setId,
        studentId: sid,
        assignedBy: req.user._id,
        method: "manual",
      });
    }
  }
  if (ops.length > 0) await ExamAssignment.insertMany(ops);

  res.status(200).json({ success: true, message: "Assigned successfully" });
});

/**
 * POST assign set randomly to all students of course
 * POST /api/v1/examconfig/sets/:setId/assign-random
 * This method assigns this particular set to students randomly OR if you meant "distribute sets randomly"
 * you might need an endpoint that distributes *multiple* sets randomly among students.
 *
 * Here: assign this set to ALL students (method=random) — if duplicates exist they will be skipped.
 */
export const assignSetRandomToAll = asyncHandler(async (req, res) => {
  const { setId } = req.params;
  const examSet = await ExamSet.findById(setId);
  if (!examSet) return res.status(404).json({ success: false, message: "Set not found" });

  const course = await Course.findById(examSet.courseId).populate("students", "_id");
  if (!course) return res.status(404).json({ success: false, message: "Course not found" });

  const studentIds = (course.students || []).map((s) => s._id.toString());
  const ops = [];
  for (const sid of studentIds) {
    const exists = await ExamAssignment.findOne({ examSetId: setId, studentId: sid });
    if (!exists) {
      ops.push({
        examSetId: setId,
        studentId: sid,
        assignedBy: req.user._id,
        method: "random",
      });
    }
  }
  if (ops.length > 0) await ExamAssignment.insertMany(ops);

  res.status(200).json({ success: true, message: "Random assignment completed" });
});

/**
 * POST add a new question
 * POST /api/v1/questions/:setId
 */
export const addQuestion = asyncHandler(async (req, res) => {
  const { setId } = req.params;
  const { type, marks, prompt, options, correctAnswerIndex, expectedAnswer } = req.body;

  const examSet = await ExamSet.findById(setId);
  if (!examSet) throw createError(404, "Exam set not found");

  // check permissions
  const isOwner = String(examSet.createdBy) === String(req.user._id);
  const isAdmin = req.user.role === "ADMIN";
  if (!isOwner && !isAdmin) throw createError(403, "Not authorized");

  if (!type || !marks || !prompt) throw createError(400, "type, marks, prompt required");

  const q = {
    examSetId: setId,
    type,
    marks: Number(marks),
    prompt,
    createdBy: req.user._id,
  };

  // handle file upload safely
  if (req.file) {
    const mime = req.file.mimetype || "";
    q.media = {
      type: mime.startsWith("image/") ? "image" : "video",
      path: `/uploads/exams/${req.file.filename}`,
      filename: req.file.filename,
      originalName: req.file.originalname,
    };
  }

  // handle MCQ
  if (type === "MCQ") {
    let opts = [];
    if (typeof options === "string") {
      try {
        opts = JSON.parse(options);
      } catch {
        throw createError(400, "Invalid options format");
      }
    } else if (Array.isArray(options)) {
      opts = options;
    }
    if (!opts?.length) throw createError(400, "MCQ options required");

    const idx = Number(correctAnswerIndex);
    if (Number.isNaN(idx) || idx < 0 || idx >= opts.length)
      throw createError(400, "Invalid correctAnswerIndex");

    q.options = opts;
    q.correctAnswerIndex = idx;
  } else if (type === "DESCRIPTIVE") {
    q.expectedAnswer = expectedAnswer || "";
  }

  const newQuestion = await Question.create(q);
  res.status(201).json({ success: true, data: newQuestion });
});

/**
 * PATCH update a question
 * PATCH /api/v1/questions/:questionId
 */
export const updateQuestion = asyncHandler(async (req, res) => {
  const { questionId } = req.params;
  const question = await Question.findById(questionId);
  if (!question) throw createError(404, "Question not found");

  // permission
  const isOwner = String(question.createdBy) === String(req.user._id);
  const isAdmin = req.user.role === "ADMIN";
  if (!isOwner && !isAdmin) throw createError(403, "Not authorized");

  const updates = req.body;

  // parse MCQ options if present
  if (updates.options) {
    if (typeof updates.options === "string") {
      try {
        updates.options = JSON.parse(updates.options);
      } catch {
        throw createError(400, "Invalid options format");
      }
    }
  }

  // handle file upload safely
  if (req.file) {
    const mime = req.file.mimetype || "";
    updates.media = {
      type: mime.startsWith("image/") ? "image" : "video",
      path: `/uploads/exams/${req.file.filename}`,
      filename: req.file.filename,
      originalName: req.file.originalname,
    };
  }

  const updated = await Question.findByIdAndUpdate(questionId, updates, { new: true });
  res.json({ success: true, data: updated });
});

/**
 * DELETE a question
 * DELETE /api/v1/questions/:questionId
 */
export const deleteQuestion = asyncHandler(async (req, res) => {
  const { questionId } = req.params;
  const question = await Question.findById(questionId);
  if (!question) throw createError(404, "Question not found");

  // permission
  const isOwner = String(question.createdBy) === String(req.user._id);
  const isAdmin = req.user.role === "ADMIN";
  if (!isOwner && !isAdmin) throw createError(403, "Not authorized");

  await question.deleteOne();
  res.json({ success: true, message: "Question deleted" });
});

/**
 * GET all questions in a specific exam set
 * Route: GET /api/v1/questions/set/:setId
 */
export const getQuestionsBySet = asyncHandler(async (req, res) => {
  const { setId } = req.params;

  if (!setId) {
    return res.status(400).json({ success: false, message: "Exam set ID is required" });
  }

  const questions = await Question.find({ examSetId: setId }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: questions.length,
    data: questions,
  });
});

/**
 * Mark an exam set as ready
 * Route: PATCH /api/v1/exam-sets/:setId/ready
 */
export const markExamSetReady = asyncHandler(async (req, res) => {
  const { setId } = req.params;

  if (!setId) {
    return res.status(400).json({ success: false, message: "Exam set ID is required" });
  }

  const examSet = await ExamSet.findById(setId);

  if (!examSet) {
    return res.status(404).json({ success: false, message: "Exam Set not found" });
  }

  // ✅ Mark the exam set as ready
  examSet.isReady = true;
  await examSet.save();

  res.status(200).json({
    success: true,
    message: "Exam Set marked as ready",
    data: examSet,
  });
});
// ================== GET ASSIGNED STUDENTS ==================
// controllers/examAssignmentController.js


// export const getAssignedStudents = async (req, res) => {
//   try {
//     const { examSetId } = req.params;

//     // 1. Find examSet (or fallback to Course)
//     let examSet = await ExamSet.findById(examSetId);
//     let courseId;

//     if (examSet) {
//       courseId = examSet.courseId;
//     } else {
//       const course = await Course.findOne({ examSets: examSetId });
//       if (!course) {
//         return res.status(404).json({ message: "Exam Set not found or not linked to any course" });
//       }
//       courseId = course._id;
//     }

//     // 2. Get all enrolled students for this course
//     const enrolledStudents = await CourseEnrollment.find({ "course.id": courseId });

//     // 3. Get all assignments for this examSet
//     const assigned = await ExamAssignment.find({ examSetId });
//     const assignedStudentIds = assigned.map(a => a.studentId.toString());

//     // 4. Build response
//     const result = enrolledStudents.map(enroll => ({
//       id: enroll.student.id,
//       name: enroll.student.name,
//       email: enroll.student.email,
//       profilePic: enroll.student.profilePic, // if exists in user doc, otherwise remove
//       assigned: assignedStudentIds.includes(enroll.student.id.toString()),
//       enrolledAt: enroll.enrolledAt,
//     }));

//     res.status(200).json({ success: true, data: result });
//   } catch (err) {
//     console.error("Error fetching assigned students:", err);
//     res.status(500).json({ message: "Error fetching assigned students", error: err.message });
//   }
// };

// Get approved exam requests with assigned status for a specific set 
// export const getApprovedExamRequests = async (req, res) => {
//   try {
//     const { courseId, setId } = req.params;

//     if (!courseId) {
//       return res.status(400).json({ success: false, message: "Course ID is required" });
//     }

//     // Fetch approved exam requests and populate user info
//     const approvedRequests = await ExamRequest.find({
//       course: courseId,
//       status: "approved",
//     }).populate("user", "name email");

//     if (!approvedRequests.length) {
//       return res.status(200).json({ success: true, data: [] });
//     }

//     // If setId is provided, fetch assigned students for that set
//     let assignedStudentIds = new Set();
//     if (setId) {
//       const set = await ExamSet.findById(setId).populate("assignedStudents", "_id");
//       if (set && set.assignedStudents && set.assignedStudents.length > 0) {
//         assignedStudentIds = new Set(set.assignedStudents.map((s) => String(s._id)));
//       }
//     }

//     // Format the response
//     const formatted = approvedRequests
//       .filter((r) => r.user) // Ensure user still exists
//       .map((r) => ({
//         id: r.user._id,
//         name: r.user.name,
//         email: r.user.email,
//         examCode: r.examCode || null,
//         registeredAt: r.createdAt ? r.createdAt.toISOString() : null,
//         assigned: setId ? assignedStudentIds.has(String(r.user._id)) : false, // mark assigned if setId given
//       }));

//     res.status(200).json({ success: true, data: formatted });
//   } catch (error) {
//     console.error("getApprovedExamRequests error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching approved exam requests",
//       error: error.message,
//     });
//   }
// };
export const getEnrolledStudentsWithApprovedRequests = async (req, res) => {
  try {
    const { courseId, setId } = req.params; // <-- get current set ID

    // 1. Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // 2. Fetch all exam requests for this course
    const requests = await ExamRequest.find({ course: courseId }).populate("user", "name email");

    // 3. Fetch all assignments for this course
    const assignments = await AssignedExam.find({ courseId }).populate("studentId", "name email");

    // 4. Map student IDs assigned in the current set and store set labels
    const currentSetAssignments = assignments.filter(a => String(a.examId) === setId);
    const currentSetStudentIds = new Set(currentSetAssignments.map(a => String(a.studentId._id)));

    // 5. Map student IDs assigned in other sets and store set labels
    const otherSetAssignments = assignments.filter(a => String(a.examId) !== setId);
    const otherSetStudentIds = new Set(otherSetAssignments.map(a => String(a.studentId._id)));

    // 6. Map assignments to studentId → setLabel (for reference)
    const studentSetLabelMap = {};
    assignments.forEach(a => {
      const sid = String(a.studentId._id);
      if (!studentSetLabelMap[sid]) studentSetLabelMap[sid] = [];
      studentSetLabelMap[sid].push(a.setLabel); // store all set labels assigned
    });

    // 7. Map to formatted students with flags and setLabel info
    const formatted = requests.map((r) => {
      const studentIdStr = String(r.user._id);
      return {
        id: r.user._id,
        name: r.user.name,
        email: r.user.email,
        approved: r.status === "approved",
        
        assignedInOtherSet: otherSetStudentIds.has(studentIdStr), // ✅ true if assigned in other set(s)
        assignedSetLabels: studentSetLabelMap[studentIdStr] || [], // all set labels student is assigned
      };
    });

    res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    console.error("getEnrolledStudentsWithApprovedRequests error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch enrolled students",
      error: err.message,
    });
  }
};




// ------------------ Assign Students to Set ------------------


// Assign selected students to an exam set

// controllers/assignedExamController.js


// Assign students manually to a set
export const assignStudentsToSet = async (req, res) => {
  try {
    const { setId } = req.params;
    const { studentIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(setId)) {
      return res.status(400).json({ success: false, message: "Invalid exam set ID" });
    }
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: "No students selected" });
    }

    // Fetch exam set
    const examSet = await ExamSet.findById(setId);
    if (!examSet) {
      return res.status(404).json({ success: false, message: "Exam set not found" });
    }

    // Fetch course info
    const course = await Course.findById(examSet.courseId);
    const courseTitle = course ? course.title : examSet.courseTitle || "Untitled Course";

    const assignments = [];

    for (const studentId of studentIds) {
      const student = await User.findById(studentId);
      if (!student) continue;

      // Check approved exam request
      const examRequest = await ExamRequest.findOne({
        user: studentId,
        course: examSet.courseId,
        status: "approved",
      });

      if (!examRequest) continue;

      // Avoid duplicates
      const exists = await AssignedExam.findOne({ examId: setId, studentId });
      if (!exists) {
        const newAssignment = await AssignedExam.create({
          examId: setId,
          examName: examSet.name,
          setLabel: examSet.setLabel,
          types: examSet.types, // MCQ/DESCRIPTIVE
          startAt: examSet.startAt,
          endAt: examSet.endAt,
          durationMinutes: examSet.durationMinutes,
          examCode: examRequest.examCode,
          studentId,
          studentName: student.name,
          studentEmail: student.email,
          courseId: examSet.courseId,
          courseTitle,
          createdBy: req.user._id,
          status: "assigned",
        });
        assignments.push(newAssignment);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Students assigned successfully",
      data: assignments,
    });
  } catch (err) {
    console.error("assignStudentsToSet error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Fetch assigned students for a specific exam set
export const getAssignedStudents = async (req, res) => {
  try {
    const { setId } = req.params; // exam set ID from params

    if (!mongoose.Types.ObjectId.isValid(setId)) {
      return res.status(400).json({ success: false, message: "Invalid exam set ID" });
    }

    // ---------------------- Existing logic ----------------------
    // Fetch all assigned exams for this set
    const assignments = await AssignedExam.find({ examId: setId })
      .populate("studentId", "name email");

    const students = assignments.map(a => ({
      studentId: a.studentId._id,
      studentName: a.studentId.name,
      studentEmail: a.studentId.email,
      examCode: a.examCode,
      examName: a.examName,
      setLabel: a.setLabel,          // current set label
      courseId: a.courseId,
      courseTitle: a.courseTitle,
      durationMinutes: a.durationMinutes,
      assignedBy: a.assignedBy,
      method: a.method,
      assignedAt: a.createdAt,
      assigned: true,
    }));

    // ---------------------- New logic ----------------------
    // Also fetch students assigned in other sets of the same course
    const courseId = assignments[0]?.courseId; // if this set has assignments
    let otherAssigned = [];
    if (courseId) {
      const other = await AssignedExam.find({ courseId, examId: { $ne: setId } })
        .populate("studentId", "name email setLabel");

      otherAssigned = other.map(o => ({
        studentId: o.studentId._id,
        studentName: o.studentId.name,
        studentEmail: o.studentId.email,
        assigned: true,
        assignedSet: o.setLabel, // store which other set
      }));
    }

    // Merge both (current set + other sets)
    const allStudentMap = new Map();
    students.forEach(s => allStudentMap.set(String(s.studentId), { ...s, currentSet: true }));
    otherAssigned.forEach(s => {
      if (!allStudentMap.has(String(s.studentId))) {
        allStudentMap.set(String(s.studentId), { ...s, currentSet: false });
      }
    });

    return res.status(200).json({
      success: true,
      data: Array.from(allStudentMap.values()),
    });

  } catch (err) {
    console.error("getAssignedStudents error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};





export const verifyFaceSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const file = req.file; // snapshot uploaded by frontend

  if (!file) {
    return res.status(400).json({ success: false, message: "Photo required for verification." });
  }

  const session = await ExamSession.findById(sessionId);
  if (!session) {
    return res.status(404).json({ success: false, message: "Session not found" });
  }

  // ✅ Ensure reference snapshot exists
  if (!session.faceSnapshot) {
    return res.status(400).json({ 
      success: false, 
      message: "No reference snapshot found for this session. Please start the exam session first." 
    });
  }

  // Convert uploaded file to base64
  const uploadedBase64 = file.buffer.toString("base64");

  // ✅ Compare uploaded snapshot with stored snapshot
  const isMatch = await compareFaces(session.faceSnapshot, uploadedBase64);

  if (!isMatch) {
    return res.status(400).json({ success: false, message: "Face verification failed. Please try again." });
  }

  // ✅ Face verified
  session.status = "verified";
  session.verifiedAt = Date.now();
  await session.save();

  res.status(200).json({ success: true, message: "Face verified, exam unlocked!", session });
});

// @desc    Get exam session details for welcome page
// @route   GET /api/v1/exam/session/:sessionId
// @access  Private
// Controller to get session details based on exam code




export const getExamSessionDetailsByCode = asyncHandler(async (req, res) => {
  const { examCode } = req.params;
  const userId = req.user._id;

  // Fetch assigned exam for this student
  const assignedExam = await AssignedExam.findOne({
    examCode,
    studentId: userId,
  });

  if (!assignedExam) {
    return res.status(404).json({ success: false, message: "Assigned exam not found" });
  }

  // Fetch course creator
  const courseCreator = await User.findById(assignedExam.createdBy).select("name");

  // Fetch exam session if exists
  let session = await ExamSession.findOne({
    examId: assignedExam._id,
    studentId: userId,
  });

  // Only create session if it doesn't exist
  if (!session) {
    session = await ExamSession.create({
      examId: assignedExam._id,
      examCode: assignedExam.examCode,
      studentId: userId,
      status: "pendingVerification",
      startTime: assignedExam.startAt || new Date(),
      faceSnapshot: "", // initialize empty
    });
  }

  // Fetch student info
  const user = await User.findById(userId).select("name email");

  // Send response including faceSnapshot
  res.status(200).json({
    success: true,
    data: {
      sessionId: session._id,
      sessionStatus: session.status,
      faceSnapshot: session.faceSnapshot || null, // Base64 string if available
      user: { name: user.name, email: user.email },
      exam: {
        code: assignedExam.examCode,
        name: assignedExam.examName,
        types: assignedExam.types,
        startDate: assignedExam.startAt,
        endDate: assignedExam.endAt,
        durationMinutes: assignedExam.durationMinutes,
        setLabel: assignedExam.setLabel,
      },
      course: { name: assignedExam.courseTitle, creatorName: courseCreator?.name || "N/A" },
    },
  });
});
