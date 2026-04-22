import mongoose from "mongoose";

const moderatorSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "moderator" },
  permissions: { type: [String], default: [] },
  blocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Moderator", moderatorSchema);
