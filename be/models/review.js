import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  flat_id: { type: mongoose.Schema.Types.ObjectId, ref: "Flat" },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Review", reviewSchema);
