import mongoose from "mongoose";

// Granular permissions: section:operation
export const ALL_PERMISSIONS = [
  "overview:read",
  "owners:read", "owners:update", "owners:delete",
  "tenants:read", "tenants:update", "tenants:delete",
  "flats:read", "flats:update", "flats:delete",
  "bookings:read", "bookings:delete",
  "moderators:read", "moderators:create", "moderators:update", "moderators:delete",
];

const adminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "admin" },
  isSuperAdmin: { type: Boolean, default: false },
  blocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Admin", adminSchema);
