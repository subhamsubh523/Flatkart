import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  phone: String,
  avatar: String,
  blocked: { type: Boolean, default: false },
  otp: String,
  otpExpiry: Date,
});

export default mongoose.model("User", userSchema);
