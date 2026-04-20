import dotenv from "dotenv";
dotenv.config();
import connectDB from "./configure/db.js";
import Owner from "./models/owner.js";

await connectDB();
const result = await Owner.updateMany({ role: { $exists: false } }, { $set: { role: "owner" } });
console.log("Updated:", result.modifiedCount, "owner documents with role field");
process.exit(0);
