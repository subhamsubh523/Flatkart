import User from "../models/user.js";
import Owner from "../models/owner.js";
import PendingOTP from "../models/pendingOtp.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOTPEmail } from "../configure/mailer.js";
import { uploadAvatarToCloudinary } from "../middleware/upload.js";

// Helper — find user from either collection by email
const findByEmail = async (email) => {
  const user = await User.findOne({ email });
  if (user) return { doc: user, model: User };
  const owner = await Owner.findOne({ email });
  if (owner) return { doc: owner, model: Owner };
  return null;
};

// Helper — find user from either collection by id
const findById = async (id) => {
  const user = await User.findById(id);
  if (user) return { doc: user, model: User };
  const owner = await Owner.findById(id);
  if (owner) return { doc: owner, model: Owner };
  return null;
};

export const sendRegisterOTP = async (req, res) => {
  const { email, role, phone } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });
  const existing = await findByEmail(email);
  if (existing) return res.status(400).json({ message: "Email already registered" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + 10 * 60 * 1000;
  await PendingOTP.findOneAndUpdate(
    { email },
    { $set: { email, otp, expiry, role, phone } },
    { upsert: true, new: true }
  );
  try {
    await sendOTPEmail(email, otp, "Verify your Flatkart account", "📧 Email Verification", "Use the OTP below to verify your email and complete registration:");
    res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("Email error:", err.message);
    res.status(500).json({ message: "Failed to send OTP email" });
  }
};

export const register = async (req, res) => {
  const { name, email, password, role, otp, phone } = req.body;
  const pending = await PendingOTP.findOne({ email, otp });
  if (!pending || pending.expiry < Date.now()) return res.status(400).json({ message: "Invalid or expired OTP" });
  await PendingOTP.deleteOne({ email });
  const hashed = await bcrypt.hash(password, 10);
  if (role === "owner") {
    const owner = await Owner.create({ name, email, password: hashed, role: "owner", phone });
    res.json(owner);
  } else {
    const user = await User.create({ name, email, password: hashed, role: "tenant", phone });
    res.json(user);
  }
};

export const login = async (req, res) => {
  const { email, password, role } = req.body;
  const found = await findByEmail(email);
  if (!found) return res.status(400).json({ message: "User does not exist. Please register." });
  if (role && found.doc.role !== role) return res.status(403).json({ message: `No ${role} account found with this email.` });
  if (!await bcrypt.compare(password, found.doc.password)) return res.status(400).json({ message: "Invalid password. Please try again." });
  if (found.doc.blocked) return res.status(403).json({ message: "Your account has been blocked. Please contact support." });
  const token = jwt.sign({ id: found.doc._id }, process.env.JWT_SECRET);
  res.json({ token, user: { id: found.doc._id, name: found.doc.name, email: found.doc.email, role: found.doc.role, avatar: found.doc.avatar || null } });
};

export const me = async (req, res) => {
  const found = await findById(req.user.id);
  if (!found) return res.status(404).json({ message: "User not found" });
  const doc = found.doc.toObject();
  delete doc.password;
  res.json(doc);
};

export const updateProfile = async (req, res) => {
  const update = {};
  if (req.body.name) update.name = req.body.name;
  if (req.file) {
    const result = await uploadAvatarToCloudinary(req.file.buffer);
    update.avatar = result.secure_url;
  }
  if (!Object.keys(update).length) return res.status(400).json({ message: "Nothing to update" });
  const found = await findById(req.user.id);
  if (!found) return res.status(404).json({ message: "User not found" });
  const updated = await found.model.findByIdAndUpdate(req.user.id, update, { new: true }).select("-password");
  res.json(updated);
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const found = await findById(req.user.id);
  if (!found) return res.status(404).json({ message: "User not found" });
  const isMatch = await bcrypt.compare(currentPassword, found.doc.password);
  if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });
  found.doc.password = await bcrypt.hash(newPassword, 10);
  await found.doc.save();
  res.json({ message: "Password changed successfully" });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const found = await findByEmail(email);
  if (!found) return res.status(404).json({ message: "No account found with this email" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  found.doc.otp = otp;
  found.doc.otpExpiry = Date.now() + 10 * 60 * 1000;
  await found.doc.save();

  try {
    await sendOTPEmail(email, otp);
    res.json({ message: `OTP sent to ${email}` });
  } catch (err) {
    console.error("Email error:", err.message);
    res.status(500).json({ message: "Failed to send OTP email. Check server email configuration." });
  }
};

export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email, otp, otpExpiry: { $gt: Date.now() } });
  const owner = await Owner.findOne({ email, otp, otpExpiry: { $gt: Date.now() } });
  if (!user && !owner) return res.status(400).json({ message: "Invalid or expired OTP" });
  res.json({ message: "OTP verified" });
};

export const updatePhone = async (req, res) => {
  const { phone } = req.body;
  if (!phone?.trim()) return res.status(400).json({ message: "Phone number is required" });
  const found = await findById(req.user.id);
  if (!found) return res.status(404).json({ message: "User not found" });
  const updated = await found.model.findByIdAndUpdate(req.user.id, { phone }, { new: true }).select("-password");
  res.json({ phone: updated.phone });
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  let doc = await User.findOne({ email, otp, otpExpiry: { $gt: Date.now() } });
  if (!doc) doc = await Owner.findOne({ email, otp, otpExpiry: { $gt: Date.now() } });
  if (!doc) return res.status(400).json({ message: "Invalid or expired OTP" });
  doc.password = await bcrypt.hash(newPassword, 10);
  doc.otp = undefined;
  doc.otpExpiry = undefined;
  await doc.save();
  res.json({ message: "Password reset successfully" });
};
