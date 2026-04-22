import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin, { ALL_PERMISSIONS } from "../models/admin.js";
import Moderator from "../models/moderator.js";
import User from "../models/user.js";
import Owner from "../models/owner.js";
import Flat from "../models/flat.js";
import Booking from "../models/booking.js";
import adminAuth, { requirePermission } from "../middleware/adminMiddleware.js";

const router = express.Router();

// ── Moderator Login (separate panel) ─────────────────
router.post("/moderator-login", async (req, res) => {
  const { email, password } = req.body;
  const mod = await Moderator.findOne({ email });
  if (!mod || !await bcrypt.compare(password, mod.password))
    return res.status(400).json({ message: "Invalid credentials" });
  if (mod.blocked) return res.status(403).json({ message: "Your account has been disabled. Contact the admin." });
  const token = jwt.sign(
    { id: mod._id, role: "admin", name: mod.name, email: mod.email, isSuperAdmin: false, permissions: mod.permissions },
    process.env.JWT_SECRET
  );
  res.json({ token, moderator: { id: mod._id, name: mod.name, email: mod.email, isSuperAdmin: false, permissions: mod.permissions } });
});

// ── Admin Profile Update ───────────────────────────────────────
router.put("/profile", adminAuth, async (req, res) => {
  const { name, email, currentPassword, newPassword } = req.body;
  const admin = await Admin.findById(req.admin.id);
  if (!admin) return res.status(404).json({ message: "Admin not found" });
  if (name) admin.name = name;
  if (email && email !== admin.email) {
    const exists = await Admin.findOne({ email, _id: { $ne: admin._id } });
    if (exists) return res.status(400).json({ message: "Email already in use" });
    admin.email = email;
  }
  if (newPassword) {
    if (!currentPassword) return res.status(400).json({ message: "Current password is required" });
    const match = await bcrypt.compare(currentPassword, admin.password);
    if (!match) return res.status(400).json({ message: "Current password is incorrect" });
    admin.password = await bcrypt.hash(newPassword, 10);
  }
  await admin.save();
  const { password: _, ...safe } = admin.toObject();
  res.json(safe);
});

// ── Admins (sub-admins) ──────────────────────────────
router.get("/admins", adminAuth, async (req, res) => {
  const admins = await Admin.find().select("-password").sort("-createdAt");
  res.json(admins);
});

router.post("/admins", adminAuth, async (req, res) => {
  if (!req.admin.isSuperAdmin) return res.status(403).json({ message: "Only Super Admin can create new admins" });
  const { name, email, password } = req.body;
  const exists = await Admin.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already in use" });
  const hashed = await bcrypt.hash(password, 10);
  const admin = await Admin.create({ name, email, password: hashed, isSuperAdmin: false });
  const { password: _, ...safe } = admin.toObject();
  res.json(safe);
});

router.put("/admins/:id", adminAuth, async (req, res) => {
  const { name, email, password } = req.body;
  const update = {};
  if (name) update.name = name;
  if (email) {
    const exists = await Admin.findOne({ email, _id: { $ne: req.params.id } });
    if (exists) return res.status(400).json({ message: "Email already in use" });
    update.email = email;
  }
  if (password) update.password = await bcrypt.hash(password, 10);
  const updated = await Admin.findByIdAndUpdate(req.params.id, update, { new: true }).select("-password");
  if (!updated) return res.status(404).json({ message: "Admin not found" });
  res.json(updated);
});

router.patch("/admins/:id/toggle", adminAuth, async (req, res) => {
  if (!req.admin.isSuperAdmin) return res.status(403).json({ message: "Only Super Admin can disable admins" });
  const target = await Admin.findById(req.params.id);
  if (!target) return res.status(404).json({ message: "Admin not found" });
  if (target._id.toString() === req.admin.id) return res.status(400).json({ message: "Cannot disable your own account" });
  target.blocked = !target.blocked;
  await target.save();
  const { password: _, ...safe } = target.toObject();
  res.json(safe);
});

router.delete("/admins/:id", adminAuth, async (req, res) => {
  if (!req.admin.isSuperAdmin) return res.status(403).json({ message: "Only Super Admin can delete admins" });
  const target = await Admin.findById(req.params.id);
  if (!target) return res.status(404).json({ message: "Admin not found" });
  if (target._id.toString() === req.admin.id) return res.status(400).json({ message: "Cannot delete your own account" });
  await Admin.findByIdAndDelete(req.params.id);
  res.json({ message: "Admin deleted" });
});

// ── Setup ─────────────────────────────────────────────
router.post("/setup", async (req, res) => {
  const exists = await Admin.findOne({});
  if (exists) return res.status(400).json({ message: "Admin already exists" });
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const admin = await Admin.create({ name, email, password: hashed, isSuperAdmin: true });
  res.json({ message: "Super admin created", admin });
});

// ── Login ─────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });
  if (!admin || !await bcrypt.compare(password, admin.password))
    return res.status(400).json({ message: "Invalid credentials" });
  if (admin.blocked) return res.status(403).json({ message: "Your account has been disabled. Contact the Super Admin." });
  const isSuperAdmin = admin.isSuperAdmin !== false; // default true for existing admins
  const token = jwt.sign(
    { id: admin._id, role: "admin", name: admin.name, email: admin.email, isSuperAdmin, permissions: ALL_PERMISSIONS },
    process.env.JWT_SECRET
  );
  res.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email, isSuperAdmin, permissions: ALL_PERMISSIONS } });
});

// ── Stats ─────────────────────────────────────────────
router.get("/stats", adminAuth, async (req, res) => {
  const [owners, tenants, flats, bookings] = await Promise.all([
    Owner.countDocuments(), User.countDocuments(), Flat.countDocuments(), Booking.countDocuments(),
  ]);
  const approvedBookings = await Booking.countDocuments({ status: "approved" });
  const rentedFlats = await Flat.countDocuments({ rented: true });
  const restrictedOwners = await Owner.countDocuments({ bookingRestricted: true });
  const blockedOwners = await Owner.countDocuments({ blocked: true });
  const blockedTenants = await User.countDocuments({ blocked: true });
  const allowedOwners = owners - restrictedOwners;
  const unblockedOwners = owners - blockedOwners;
  const unblockedTenants = tenants - blockedTenants;
  res.json({ owners, tenants, flats, bookings, approvedBookings, rentedFlats, restrictedOwners, allowedOwners, blockedOwners, unblockedOwners, blockedTenants, unblockedTenants });
});

// ── Moderators ────────────────────────────────────────
router.get("/moderators", adminAuth, async (req, res) => {
  const mods = await Moderator.find().select("-password").sort("-createdAt");
  res.json(mods);
});

router.post("/moderators", adminAuth, async (req, res) => {
  const { name, email, password, permissions } = req.body;
  const exists = await Moderator.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already in use" });
  const hashed = await bcrypt.hash(password, 10);
  const mod = await Moderator.create({ name, email, password: hashed, permissions: permissions || [] });
  const { password: _, ...safe } = mod.toObject();
  res.json(safe);
});

router.put("/moderators/:id", adminAuth, async (req, res) => {
  const { name, email, password, permissions } = req.body;
  const update = {};
  if (name) update.name = name;
  if (email) {
    const exists = await Moderator.findOne({ email, _id: { $ne: req.params.id } });
    if (exists) return res.status(400).json({ message: "Email already in use" });
    update.email = email;
  }
  if (password) update.password = await bcrypt.hash(password, 10);
  if (permissions !== undefined) update.permissions = permissions;
  const mod = await Moderator.findByIdAndUpdate(req.params.id, update, { new: true }).select("-password");
  if (!mod) return res.status(404).json({ message: "Moderator not found" });
  res.json(mod);
});

router.patch("/moderators/:id/toggle", adminAuth, async (req, res) => {
  const mod = await Moderator.findById(req.params.id);
  if (!mod) return res.status(404).json({ message: "Moderator not found" });
  mod.blocked = !mod.blocked;
  await mod.save();
  const { password: _, ...safe } = mod.toObject();
  res.json(safe);
});

router.delete("/moderators/:id", adminAuth, async (req, res) => {
  await Moderator.findByIdAndDelete(req.params.id);
  res.json({ message: "Moderator deleted" });
});

// ── Owners ────────────────────────────────────────────
router.get("/owners", adminAuth, async (req, res) => {
  const owners = await Owner.find().select("-password").sort("-createdAt");
  res.json(owners);
});

router.patch("/owners/:id/toggle", adminAuth, async (req, res) => {
  const owner = await Owner.findById(req.params.id);
  if (!owner) return res.status(404).json({ message: "Owner not found" });
  owner.blocked = !owner.blocked;
  await owner.save();
  res.json(owner);
});

router.patch("/owners/:id/toggle-booking", adminAuth, async (req, res) => {
  const owner = await Owner.findById(req.params.id);
  if (!owner) return res.status(404).json({ message: "Owner not found" });
  owner.bookingRestricted = !owner.bookingRestricted;
  await owner.save();
  console.log(`Owner ${owner._id} bookingRestricted set to ${owner.bookingRestricted}`);
  res.json({ _id: owner._id, bookingRestricted: owner.bookingRestricted });
});

router.delete("/owners/:id", adminAuth, async (req, res) => {
  await Owner.findByIdAndDelete(req.params.id);
  await Flat.deleteMany({ owner_id: req.params.id });
  res.json({ message: "Owner deleted" });
});

// ── Tenants ───────────────────────────────────────────
router.get("/tenants", adminAuth, async (req, res) => {
  const tenants = await User.find().select("-password").sort("-createdAt");
  res.json(tenants);
});

router.patch("/tenants/:id/toggle", adminAuth, async (req, res) => {
  const tenant = await User.findById(req.params.id);
  if (!tenant) return res.status(404).json({ message: "Tenant not found" });
  tenant.blocked = !tenant.blocked;
  await tenant.save();
  res.json(tenant);
});

router.delete("/tenants/:id", adminAuth, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  await Booking.deleteMany({ tenant_id: req.params.id });
  res.json({ message: "Tenant deleted" });
});

// ── Flats ─────────────────────────────────────────────
router.get("/flats", adminAuth, async (req, res) => {
  const flats = await Flat.find().sort("-_id");
  res.json(flats);
});

router.patch("/flats/:id/toggle", adminAuth, async (req, res) => {
  const flat = await Flat.findById(req.params.id);
  if (!flat) return res.status(404).json({ message: "Flat not found" });
  flat.visible = !flat.visible;
  await flat.save();
  res.json(flat);
});

router.delete("/flats/:id", adminAuth, async (req, res) => {
  await Flat.findByIdAndDelete(req.params.id);
  await Booking.deleteMany({ flat_id: req.params.id });
  res.json({ message: "Flat deleted" });
});

// ── Bookings ──────────────────────────────────────────
router.get("/bookings", adminAuth, async (req, res) => {
  const bookings = await Booking.find()
    .populate("flat_id", "location state district city locality country pincode landmark houseNo type price roomWidth roomBreadth description images image rented visible owner_id")
    .populate("tenant_id", "name email")
    .sort("-createdAt");

  const result = await Promise.all(bookings.map(async (b) => {
    const obj = b.toObject();
    if (obj.flat_id?.owner_id) {
      const owner = await Owner.findById(obj.flat_id.owner_id).select("name email blocked bookingRestricted").catch(() => null);
      obj.owner = owner ? { _id: owner._id, name: owner.name, email: owner.email, blocked: owner.blocked, bookingRestricted: owner.bookingRestricted } : null;
    }
    return obj;
  }));
  res.json(result);
});

router.patch("/bookings/:id/status", adminAuth, async (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected", "pending"].includes(status))
    return res.status(400).json({ message: "Invalid status" });
  const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true })
    .populate("flat_id", "location type price owner_id")
    .populate("tenant_id", "name email");
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  const obj = booking.toObject();
  if (obj.flat_id?.owner_id) {
    const owner = await Owner.findById(obj.flat_id.owner_id).select("name email").catch(() => null);
    obj.owner = owner ? { name: owner.name, email: owner.email } : null;
  }
  res.json(obj);
});

router.delete("/bookings/:id", adminAuth, async (req, res) => {
  await Booking.findByIdAndDelete(req.params.id);
  res.json({ message: "Booking deleted" });
});

export default router;
