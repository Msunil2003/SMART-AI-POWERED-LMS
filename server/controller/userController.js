import createError from "../utils/error.js";
import User from "../models/userModel.js";
import bcryptjs from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import asyncHandler from "express-async-handler";
import sendMail from "../utils/sendMail.js";
import crypto from "crypto";
import JWT from "jsonwebtoken";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// Cookie settings
const cookieOptions = {
  httpOnly: true,
  sameSite: "Lax",
  secure: false,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ================= SIGNUP =================
export const signup = asyncHandler(async (req, res) => {
  const { fullName, email, password, role, token } = req.body;

  if (!fullName || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User already exists with this email");
  }

  let invitedByAdmin = false;
  if (token) {
    try {
      const decoded = JWT.verify(token, process.env.JWT_SECRET);
      if (decoded.role === "INSTRUCTOR") invitedByAdmin = true;
    } catch (error) {
      throw new ApiError(401, "Invalid or expired invite token");
    }
  }

  // Upload avatar if sent
  let avatarData = {
    public_id: "default_avatar",
    secure_url: "https://res.cloudinary.com/demo/image/upload/v1700000000/default_avatar.png",
  };

  if (req.files?.avatar) {
    avatarData = await cloudinary.uploader.upload(req.files.avatar.tempFilePath, {
      folder: "lms",
      width: 250,
      height: 250,
      gravity: "faces",
      crop: "fill",
    });
  }

  const user = await User.create({
    name: fullName,
    email,
    password,
    role: invitedByAdmin ? "INSTRUCTOR" : role || "USER",
    avatar: { public_id: avatarData.public_id, secure_url: avatarData.secure_url },
    invitedByAdmin,
    invitationStatus: invitedByAdmin ? "ACCEPTED" : undefined,
  });

  const tokenJwt = user.generateToken();

  const userSafeData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    access: user.access,
  };

  return res
    .status(201)
    .cookie("token", tokenJwt, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json(new ApiResponse(201, { user: userSafeData, token: tokenJwt }, "Signup successful"));
});

// ================= LOGIN =================
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(createError(400, "All input fields are required"));

  const userData = await User.findOne({ email }).select("+password");
  if (!userData) return next(createError(404, "User with this email not found"));

  const isMatch = await bcryptjs.compare(password, userData.password);
  if (!isMatch) return next(createError(401, "Invalid email or password"));

  if (userData.isBanned) {
    return res.status(200).json({
      banned: true,
      reason: userData.banReason || "Violation of rules",
      message: userData.banMessage || "Please contact support",
      user: { name: userData.name, email: userData.email, subscription: { status: userData.subscription?.status || "Inactive" } },
    });
  }

  const token = await userData.generateToken();
  userData.password = undefined;

  res.cookie("token", token, cookieOptions);
  res.status(200).json({ success: true, message: `Welcome back ${userData.name}`, token, userData });
});

// ================= LOGOUT =================
export const logout = asyncHandler(async (req, res) => {
  res.cookie("token", null, { httpOnly: true, sameSite: "Lax", secure: false, maxAge: 0 });
  res.status(200).json({ success: true, message: "User logged out successfully" });
});

// ================= GET PROFILE =================
export const getProfile = asyncHandler(async (req, res, next) => {
  if (!req.user?.id) return next(createError(401, "Unauthorized"));

  const user = await User.findById(req.user.id).select("-password");
  if (!user) return next(createError(404, "User not found"));

  res.status(200).json({ success: true, message: "User details retrieved successfully", user });
});

// ================= UPDATE PROFILE =================
export const updateProfile = asyncHandler(async (req, res) => {
  if (!req.user?.id) return next(createError(401, "Unauthorized"));

  const user = await User.findById(req.user.id);
  if (!user) return next(createError(404, "User does not exist"));

  if (req.body.name) user.name = req.body.name;

  if (req.files?.avatar) {
    if (user.avatar?.public_id && user.avatar.public_id !== "default_avatar") {
      await cloudinary.uploader.destroy(user.avatar.public_id);
    }
    const result = await cloudinary.uploader.upload(req.files.avatar.tempFilePath, {
      folder: "lms",
      width: 250,
      height: 250,
      gravity: "faces",
      crop: "fill",
    });
    user.avatar.public_id = result.public_id;
    user.avatar.secure_url = result.secure_url;
  }

  await user.save();
  res.status(200).json({ success: true, message: "Profile updated successfully", user });
});

// ================= DELETE PROFILE =================
export const deleteProfile = asyncHandler(async (req, res) => {
  if (!req.user?.id) return next(createError(401, "Unauthorized"));

  const user = await User.findByIdAndDelete(req.user.id);
  if (!user) return next(createError(404, "User does not exist"));

  if (user.avatar?.public_id && user.avatar.public_id !== "default_avatar") {
    await cloudinary.uploader.destroy(user.avatar.public_id);
  }

  res.status(200).json({ success: true, message: "Profile deleted successfully" });
});

// ================= FORGOT PASSWORD =================
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return next(createError(400, "Email is required"));

  const user = await User.findOne({ email });
  if (!user) return next(createError(404, "User not found"));

  const resetToken = await user.generateResetToken();
  await user.save();

  const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const message = `
    You can reset your password by clicking <a href="${encodeURI(resetPasswordUrl)}" target="_blank">Reset your password</a>.
    Or copy-paste this URL: ${encodeURI(resetPasswordUrl)}
  `;

  try {
    await sendMail(process.env.GMAIL_ID, email, "Reset Password", message);
    res.status(200).json({ success: true, message: `Reset password email sent to ${email}` });
  } catch (err) {
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save();
    return next(createError(500, err.message));
  }
});

// ================= RESET PASSWORD =================
export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  const forgotPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  const user = await User.findOne({ forgotPasswordToken, forgotPasswordExpiry: { $gt: Date.now() } });
  if (!user) return next(createError(400, "Token is invalid or expired"));

  user.password = password;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;

  await user.save();
  res.status(200).json({ success: true, message: "Password reset successfully" });
});

// ================= CHANGE PASSWORD =================
export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return next(createError(400, "All fields are required"));

  const user = await User.findById(req.user.id).select("+password");
  if (!user) return next(createError(404, "User does not exist"));

  const isMatch = await bcryptjs.compare(oldPassword, user.password);
  if (!isMatch) return next(createError(401, "Invalid old password"));

  user.password = newPassword;
  await user.save();
  res.status(200).json({ success: true, message: "Password changed successfully" });
});

// ================= ADMIN: GET ALL USERS =================
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  res.status(200).json({ success: true, message: "All users fetched successfully", users });
});

// ================= ADMIN: TOGGLE BAN/UNBAN =================
export const toggleBanUser = asyncHandler(async (req, res) => {
  const { banReason, banMessage } = req.body;
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) return next(createError(404, "User not found"));

  user.isBanned = !user.isBanned;
  if (user.isBanned) {
    if (!banReason || !banMessage) return next(createError(400, "Ban reason & message required"));
    user.banReason = banReason;
    user.banMessage = banMessage;
  } else {
    user.banReason = undefined;
    user.banMessage = undefined;
  }

  await user.save();
  res.status(200).json({ success: true, message: `User ${user.isBanned ? "banned" : "unbanned"} successfully`, user });
});

// ================= ADMIN: INVITE INSTRUCTORS =================
export const inviteInstructor = asyncHandler(async (req, res) => {
  const { emails } = req.body;
  if (!emails?.length) return next(createError(400, "No emails provided"));

  const failedEmails = [];
  const successEmails = [];

  for (const rawEmail of emails) {
    const email = rawEmail.trim();
    if (!email) { failedEmails.push({ email, reason: "Empty email" }); continue; }

    const existing = await User.findOne({ email });
    if (existing) { failedEmails.push({ email, reason: "User exists" }); continue; }

    const token = JWT.sign({ email, role: "INSTRUCTOR" }, process.env.JWT_SECRET, { expiresIn: "24h" });
    const inviteLink = `${process.env.FRONTEND_URL}/instructor/signup?token=${token}&email=${encodeURIComponent(email)}`;

    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: auto; background: #fff; padding: 30px; border-radius: 8px;">
          <h2 style="text-align: center;">👩‍🏫 Smart LMS Instructor Invitation</h2>
          <p>Hello 👋, You've been invited to become an <strong>Instructor</strong>! Click below to signup:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${inviteLink}" target="_blank" style="background-color:#2563eb;color:#fff;padding:12px 25px;border-radius:6px;">Sign up</a>
          </div>
          <p>Expires in 24 hours.</p>
        </div>
      </div>
    `;

    try { await sendMail(`SMART LMS <${process.env.GMAIL_ID}>`, email, "Instructor Invite", htmlMessage); successEmails.push(email); }
    catch { failedEmails.push({ email, reason: "Failed to send" }); }
  }

  res.status(200).json({ message: "Invite process completed", invited: successEmails, failed: failedEmails });
});

// ================= VERIFY INVITE =================
export const verifyInvite = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) return next(createError(400, "No token provided"));

  try {
    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    if (!decoded || decoded.role !== "INSTRUCTOR") return next(createError(403, "Invalid or expired token"));
    res.status(200).json({ success: true, email: decoded.email, role: decoded.role, message: "Valid invite token" });
  } catch { return next(createError(403, "Invalid or expired token")); }
});

// ================= GET PENDING INSTRUCTORS =================
export const getPendingInstructors = asyncHandler(async (req, res) => {
  const instructors = await User.find({ role: "INSTRUCTOR", approvalStatus: { $regex: /^pending$/i } }).select("name email approvalStatus");
  res.status(200).json({ success: true, instructors });
});

// ================= UPDATE INSTRUCTOR STATUS =================
export const updateInstructorStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let { status } = req.body;
  if (!status) return res.status(400).json({ success: false, message: "Status missing" });

  status = status.toUpperCase();
  if (!["APPROVED", "REJECTED"].includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });

  const instructor = await User.findById(id);
  if (!instructor) return res.status(404).json({ success: false, message: "User not found" });

  instructor.approvalStatus = status;
  await instructor.save();
  res.status(200).json({ success: true, message: `Instructor ${status} successfully`, instructor });
});

// ================= GET INSTRUCTOR STATUS =================
export const getInstructorStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("name email role approvalStatus");
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.role !== "INSTRUCTOR") return res.status(403).json({ message: "You are not an instructor" });

  res.status(200).json({ name: user.name, email: user.email, role: user.role, status: user.approvalStatus });
});
