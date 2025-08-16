import express from "express";
import { changePassword, deleteProfile, forgotPassword, getProfile, login, logout, resetPassword, signup, updateProfile, getAllUsers, toggleBanUser, inviteInstructor,verifyInvite,getPendingInstructors,updateInstructorStatus,getInstructorStatus } from "../controller/userController.js";
import { isLoggedIn, isAdmin  } from "../middleware/authMiddleware.js";
import upload from "../middleware/multer.js";

const router = express.Router()

router.post("/signup", upload.single("avatar"), signup)
router.post("/login", login)
router.get("/logout", logout)
router.get("/myprofile", isLoggedIn, getProfile)
router.post("/forgot-password", forgotPassword)
router.post("/reset/:resetToken", resetPassword)
router.put("/change-password", isLoggedIn, changePassword)
router.put("/update", isLoggedIn, upload.single("avatar"), updateProfile)
router.delete("/delete-profile", isLoggedIn, deleteProfile)

// ✅ Admin-only Routes
router.get("/admin/users", isLoggedIn, isAdmin, getAllUsers);
// 🟡 Route to get all pending instructors
// router.get('/instructors/pending', isLoggedIn, isAdmin, getPendingInstructors);

//✅ Fetch all pending instructors
router.get("/instructors/pending", isLoggedIn, isAdmin, getPendingInstructors);

// ✅ Update instructor status
router.put("/:id/status", isLoggedIn, isAdmin, updateInstructorStatus);

router.get("/instructor/status", isLoggedIn,isAdmin, getInstructorStatus);
// ✅ Toggle ban/unban with reason/message
router.patch("/admin/users/:id/toggle-ban", isLoggedIn, isAdmin, toggleBanUser);


// 💌 Instructor invite route
router.post('/invite-instructor', isLoggedIn, isAdmin, inviteInstructor);
router.post('/verify-invite', verifyInvite);





export default router