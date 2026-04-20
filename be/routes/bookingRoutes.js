import express from "express";
import auth from "../middleware/authMiddleware.js";
import Booking from "../models/booking.js";
import Flat from "../models/flat.js";
import Owner from "../models/owner.js";

const router = express.Router();

router.post("/", auth, async (req, res) => {
  const { flat_id } = req.body;
  const existing = await Booking.findOne({ flat_id, tenant_id: req.user.id, status: { $in: ["pending", "approved"] } });
  if (existing) return res.status(400).json({ message: "Already booked" });
  const booking = await Booking.create({ flat_id, tenant_id: req.user.id });
  res.json(booking);
});

router.get("/my", auth, async (req, res) => {
  const bookings = await Booking.find({ tenant_id: req.user.id }).populate("flat_id");
  const orphaned = bookings.filter((b) => !b.flat_id).map((b) => b._id);
  if (orphaned.length) await Booking.deleteMany({ _id: { $in: orphaned } });
  res.json(bookings.filter((b) => b.flat_id));
});

router.get("/owner", auth, async (req, res) => {
  const flats = await Flat.find({ owner_id: req.user.id });
  const flatIds = flats.map((f) => f._id);
  const bookings = await Booking.find({ flat_id: { $in: flatIds } })
    .populate("flat_id")
    .populate("tenant_id", "name email");
  res.json(bookings);
});

router.put("/:id", auth, async (req, res) => {
  // Check if owner is booking-restricted before allowing approve/reject
  const owner = await Owner.findById(req.user.id);
  if (owner?.bookingRestricted) return res.status(403).json({ message: "You are restricted from approving or rejecting bookings. Please contact admin." });

  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  if (req.body.status === "approved" && booking?.flat_id) {
    await Flat.findByIdAndUpdate(booking.flat_id, { rented: true });
  }
  if (req.body.status === "rejected" && booking?.flat_id) {
    await Flat.findByIdAndUpdate(booking.flat_id, { rented: false });
  }
  res.json(booking);
});

router.patch("/:id/cancel", auth, async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, tenant_id: req.user.id });
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  if (booking.status !== "pending") return res.status(400).json({ message: "Only pending bookings can be cancelled" });
  booking.status = "cancelled";
  await booking.save();
  res.json(booking);
});

export default router;
