import express from "express";
import auth from "../middleware/authMiddleware.js";
import Review from "../models/review.js";
import Flat from "../models/flat.js";

const router = express.Router();

// All reviews for all flats owned by the logged-in owner
router.get("/owner/all", auth, async (req, res) => {
  const flats = await Flat.find({ owner_id: req.user.id }).select("_id location type");
  const flatIds = flats.map((f) => f._id);
  const reviews = await Review.find({ flat_id: { $in: flatIds } })
    .populate("user_id", "name email avatar")
    .populate("flat_id", "location type")
    .sort({ createdAt: -1 });
  res.json(reviews);
});

router.get("/:flat_id/summary", async (req, res) => {
  const reviews = await Review.find({ flat_id: req.params.flat_id });
  const count = reviews.length;
  const avg = count ? (reviews.reduce((s, r) => s + r.rating, 0) / count).toFixed(1) : null;
  res.json({ count, avg });
});

router.get("/:flat_id/all", auth, async (req, res) => {
  const reviews = await Review.find({ flat_id: req.params.flat_id }).populate("user_id", "name");
  res.json(reviews);
});

router.post("/", auth, async (req, res) => {
  const { flat_id, rating, comment } = req.body;
  const review = await Review.create({ flat_id, user_id: req.user.id, rating, comment });
  res.json(review);
});

router.get("/:flat_id/mine", auth, async (req, res) => {
  const review = await Review.findOne({ flat_id: req.params.flat_id, user_id: req.user.id });
  res.json(review || null);
});

router.get("/:flat_id", async (req, res) => {
  const reviews = await Review.find({ flat_id: req.params.flat_id }).populate("user_id", "name");
  res.json(reviews);
});

export default router;
