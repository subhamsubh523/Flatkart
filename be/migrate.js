import dotenv from "dotenv";
dotenv.config();
import connectDB from "./configure/db.js";
import Admin from "./models/admin.js";

await connectDB();

// Find the oldest admin (first created) — that's the super admin
const oldest = await Admin.findOne().sort({ createdAt: 1 });
if (!oldest) { console.log("No admins found."); process.exit(0); }

// Set all admins to isSuperAdmin: false first
await Admin.updateMany({}, { $set: { isSuperAdmin: false } });

// Then set only the oldest one as super admin
await Admin.findByIdAndUpdate(oldest._id, { $set: { isSuperAdmin: true } });

console.log(`Super admin set to: ${oldest.name} (${oldest.email})`);
console.log("All other admins set to isSuperAdmin: false");
process.exit(0);
