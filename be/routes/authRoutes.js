import express from "express";
import { register, login, me, updateProfile, changePassword, forgotPassword, verifyOTP, resetPassword, sendRegisterOTP } from "../controllers/authController.js";
import auth from "../middleware/authMiddleware.js";
import { uploadAvatar } from "../middleware/upload.js";

const router = express.Router();

router.post("/send-register-otp", sendRegisterOTP);
router.post("/register", register);
router.post("/login", login);
router.get("/me", auth, me);
router.put("/update-profile", auth, uploadAvatar.single("avatar"), updateProfile);
router.put("/change-password", auth, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

export default router;
