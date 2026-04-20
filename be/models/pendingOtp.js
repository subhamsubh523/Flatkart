import mongoose from "mongoose";

const pendingOtpSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  otp: String,
  expiry: Number,
  role: String,
  phone: String,
});

export default mongoose.model("PendingOTP", pendingOtpSchema);
