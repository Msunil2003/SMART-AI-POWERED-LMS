// controllers/examController.js
import asyncHandler from "express-async-handler";
import ExamRequest from "../models/examRequestModel.js";
import User from "../models/userModel.js";
import Course from "../models/courseModel.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import sendMail from "../utils/sendMail.js";

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

  const request = await ExamRequest.findById(requestId).populate("course");
  if (!request) throw new ApiError(404, "Request not found");
  if (request.status === "approved") throw new ApiError(400, "Request already approved");

  // Check authorization: only admin or course creator
  const courseCreatorId = request.course.createdBy?.id || request.course.createdBy;
  if (req.user.role !== "ADMIN" && String(courseCreatorId) !== String(req.user._id)) {
    throw new ApiError(403, "You are not authorized to approve this request");
  }

  // Generate secure 6-character exam code (letters + numbers + special chars)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let examCode = "";
  for (let i = 0; i < 6; i++) {
    examCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  request.status = "approved";
  request.examCode = examCode;
  await request.save();

  // Send exam code to user via email
  const user = await User.findById(request.user);
  await sendMail(
    process.env.GMAIL_ID,
    user.email,
    "Your Exam Code",
    `<p>Hello ${user.name},</p>
     <p>Your exam request for course <strong>${request.course.title}</strong> has been approved. Your Exam Code is: <strong>${examCode}</strong></p>`
  );

  res.status(200).json(new ApiResponse(200, { examCode }, "Exam request approved"));
});
// ================= VERIFY EXAM CODE =================
export const verifyExamCode = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { courseId, examCode } = req.body;
  if (!courseId || !examCode) throw new ApiError(400, "Course ID and Exam Code are required");

  // Find the approved exam request for this user and course
  const request = await ExamRequest.findOne({ user: userId, course: courseId, status: "approved" });
  if (!request) throw new ApiError(404, "No approved exam request found for this course");

  // Check if exam code matches
  if (request.examCode !== examCode) {
    return res.status(400).json(new ApiResponse(400, null, "Incorrect exam code"));
  }

  // Code is valid
  res.status(200).json(new ApiResponse(200, null, "Exam code verified successfully"));
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
