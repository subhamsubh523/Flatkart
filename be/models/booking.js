import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  flat_id: { type: mongoose.Schema.Types.ObjectId, ref: "Flat" },
  tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["pending", "approved", "rejected", "cancelled"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Booking", bookingSchema);
