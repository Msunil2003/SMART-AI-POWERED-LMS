import createError from "../utils/error.js";
import JWT from "jsonwebtoken";
import User from "../models/userModel.js";

// ✅ Middleware: Check if user is logged in
export const isLoggedIn = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(createError(401, "Please log in again"));
  }

  try {
    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(createError(401, "User not found"));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(createError(401, "Invalid token"));
  }
};

// ✅ Middleware: Role based access control
export const authorizedRole = (...roles) => (req, res, next) => {
  const currentUserRole = req.user.role;

  if (!roles.includes(currentUserRole)) {
    return next(createError(403, "You do not have permission"));
  }

  next();
};

// ✅ Middleware: Verify if user has purchased access (skip for ADMIN and INSTRUCTOR)
export const verifySubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id); // Fetch latest from DB
    if (!user) return next(createError(404, "User not found"));

    const isPrivileged = ["ADMIN", "INSTRUCTOR"].includes(user.role);
    const hasAccess = user.access?.valid === true;

    console.log(`[verifySubscription] role=${user.role}, accessValid=${hasAccess}`);

    if (!isPrivileged && !hasAccess) {
      return next(createError(403, "Please purchase access to view this content."));
    }

    next();
  } catch (err) {
    next(createError(500, "Error verifying subscription"));
  }
};

// ✅ Shorthand middleware for specific roles
export const isAdmin = authorizedRole("ADMIN");
export const isInstructor = authorizedRole("INSTRUCTOR");
export const isStudent = authorizedRole("USER");
