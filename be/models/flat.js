import mongoose from "mongoose";

const flatSchema = new mongoose.Schema({
  owner_id: String,
  location: String,
  state: String,
  district: String,
  city: String,
  locality: String,
  country: String,
  pincode: String,
  landmark: String,
  houseNo: String,
  roomWidth: String,
  roomBreadth: String,
  comments: String,
  price: Number,
  type: String,
  description: String,
  image: String,
  images: [String],
  imagePublicIds: [String],
  sold: { type: Boolean, default: false },
  rented: { type: Boolean, default: false },
  visible: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
  viewedBy: [{ type: String }],
});

export default mongoose.model("Flat", flatSchema);
