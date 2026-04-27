import express from "express";
import { searchFlats, getLocationOptions } from "../controllers/flatController.js";
import auth from "../middleware/authMiddleware.js";
import Flat from "../models/flat.js";
import Booking from "../models/booking.js";
import Owner from "../models/owner.js";
import Message from "../models/message.js";
import { upload, uploadToCloudinary, destroyFromCloudinary } from "../middleware/upload.js";
import mongoose from "mongoose";

const router = express.Router();

router.get("/search", searchFlats);
router.get("/location-options", getLocationOptions);

router.get("/count", async (req, res) => {
  const count = await Flat.countDocuments({ sold: { $ne: true }, rented: { $ne: true }, visible: { $ne: false } });
  res.json({ count });
});

router.get("/stats", async (req, res) => {
  const [flatCount, rentedCount, ownerCount, tenantCount, cities] = await Promise.all([
    Flat.countDocuments({ sold: { $ne: true }, rented: { $ne: true }, visible: { $ne: false } }),
    Flat.countDocuments({ rented: true }),
    Owner.countDocuments({ blocked: { $ne: true } }),
    (await import("../models/user.js")).default.countDocuments({ blocked: { $ne: true } }),
    Flat.distinct("city"),
  ]);
  res.json({ flatCount, rentedCount, ownerCount, tenantCount, cityCount: cities.filter(Boolean).length });
});

router.get("/mine", auth, async (req, res) => {
  const flats = await Flat.find({ owner_id: req.user.id });
  const result = flats.map((f) => {
    const obj = f.toObject();
    obj.views = f.viewedBy ? f.viewedBy.length : 0;
    return obj;
  });
  res.json(result);
});

router.get("/:id", async (req, res) => {
  const flat = await Flat.findById(req.params.id);
  if (!flat) return res.status(404).json({ message: "Flat not found" });
  const owner = await Owner.findById(flat.owner_id).select("name").catch(() => null);
  const tenantViews = flat.viewedBy.filter((v) => !v.toString().startsWith("guest_")).length;
  res.json({ ...flat.toObject(), ownerName: owner?.name || null, tenantViews });
});

router.post("/", auth, upload.array("images", 10), async (req, res) => {
  try {
    const { location, price, type, description, state, district, city, locality, country, pincode, landmark, houseNo, flatName, roomWidth, roomBreadth, comments } = req.body;
    const uploaded = await Promise.all(
      (req.files || []).map((f) => uploadToCloudinary(f.buffer, "flatkart/flats"))
    );
    const images = uploaded.map((r) => r.secure_url);
    const imagePublicIds = uploaded.map((r) => r.public_id);
    const image = images[0] || null;
    const flat = await Flat.create({ owner_id: req.user.id, location, price, type, description, image, images, imagePublicIds, state, district, city, locality, country, pincode, landmark, houseNo, flatName, roomWidth, roomBreadth, comments, imageLabels: req.body.imageLabels ? JSON.parse(req.body.imageLabels) : [] });
    res.json(flat);
  } catch (err) {
    console.error("Flat create error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", auth, upload.array("images", 10), async (req, res) => {
  try {
    const { location, price, type, description, state, district, city, locality, country, pincode, landmark, houseNo } = req.body;
    const update = { location, price, type, description };
    if (state) update.state = state;
    if (district) update.district = district;
    if (city) update.city = city;
    if (locality !== undefined) update.locality = locality;
    if (country) update.country = country;
    if (pincode) update.pincode = pincode;
    if (landmark !== undefined) update.landmark = landmark;
    if (houseNo !== undefined) update.houseNo = houseNo;
    if (req.body.imageLabels !== undefined) update.imageLabels = JSON.parse(req.body.imageLabels);
    if (req.body.flatName !== undefined) update.flatName = req.body.flatName;
    if (req.body.roomWidth !== undefined) update.roomWidth = req.body.roomWidth;
    if (req.body.roomBreadth !== undefined) update.roomBreadth = req.body.roomBreadth;
    if (req.body.comments !== undefined) update.comments = req.body.comments;
    if (req.files?.length) {
      const existing = await Flat.findById(req.params.id);
      if (existing?.imagePublicIds?.length) {
        await Promise.all(existing.imagePublicIds.map(destroyFromCloudinary));
      }
      const uploaded = await Promise.all(
        req.files.map((f) => uploadToCloudinary(f.buffer, "flatkart/flats"))
      );
      update.images = uploaded.map((r) => r.secure_url);
      update.imagePublicIds = uploaded.map((r) => r.public_id);
      update.image = update.images[0];
    }
    const flat = await Flat.findOneAndUpdate(
      { _id: req.params.id, owner_id: req.user.id },
      update,
      { new: true }
    );
    if (!flat) return res.status(404).json({ message: "Flat not found" });
    res.json(flat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id/view", async (req, res) => {
  const viewerId = req.body?.viewerId || req.ip || "guest";
  const flat = await Flat.findById(req.params.id);
  if (!flat) return res.status(404).json({ message: "Flat not found" });
  const alreadyViewed = flat.viewedBy.map((v) => v.toString()).includes(viewerId.toString());
  if (!alreadyViewed) {
    flat.viewedBy.push(viewerId);
    flat.views = flat.viewedBy.length;
    await flat.save();
  } else {
    // Correct any drift between views and viewedBy.length
    if (flat.views !== flat.viewedBy.length) {
      flat.views = flat.viewedBy.length;
      await flat.save();
    }
  }
  const tenantViews = flat.viewedBy.filter((v) => !v.toString().startsWith("guest_")).length;
  res.json({ views: flat.views, tenantViews });
});

router.patch("/:id/visibility", auth, async (req, res) => {
  const flat = await Flat.findOne({ _id: req.params.id, owner_id: req.user.id });
  if (!flat) return res.status(404).json({ message: "Flat not found" });
  flat.visible = !flat.visible;
  await flat.save();
  res.json(flat);
});

router.patch("/:id/available", auth, async (req, res) => {
  const flat = await Flat.findOneAndUpdate(
    { _id: req.params.id, owner_id: req.user.id },
    { rented: false, sold: false },
    { new: true }
  );
  if (!flat) return res.status(404).json({ message: "Flat not found" });
  res.json(flat);
});

router.patch("/:id/sold", auth, async (req, res) => {
  const flat = await Flat.findOneAndUpdate(
    { _id: req.params.id, owner_id: req.user.id },
    { sold: true },
    { new: true }
  );
  if (!flat) return res.status(404).json({ message: "Flat not found" });
  res.json(flat);
});

router.delete("/:id", auth, async (req, res) => {
  const flat = await Flat.findOneAndDelete({ _id: req.params.id, owner_id: req.user.id });
  if (!flat) return res.status(404).json({ message: "Flat not found" });
  if (flat?.imagePublicIds?.length) {
    await Promise.all(flat.imagePublicIds.map(destroyFromCloudinary));
  }
  // Find all tenants who booked this flat
  const bookings = await Booking.find({ flat_id: new mongoose.Types.ObjectId(req.params.id) });
  const tenantIds = [...new Set(bookings.map((b) => b.tenant_id?.toString()).filter(Boolean))];
  // Delete messages between owner and those tenants
  if (tenantIds.length) {
    await Message.deleteMany({
      $or: [
        { sender_id: req.user.id, receiver_id: { $in: tenantIds } },
        { sender_id: { $in: tenantIds }, receiver_id: req.user.id },
      ],
    });
  }
  await Booking.deleteMany({ flat_id: new mongoose.Types.ObjectId(req.params.id) });
  res.json({ message: "Deleted" });
});

export default router;
