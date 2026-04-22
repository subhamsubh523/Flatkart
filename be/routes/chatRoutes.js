import express from "express";
import auth from "../middleware/authMiddleware.js";
import Message from "../models/message.js";
import Owner from "../models/owner.js";
import User from "../models/user.js";
import { upload, uploadToCloudinary } from "../middleware/upload.js";

const router = express.Router();

// Get a single user's name by id (for resolving new conversations)
router.get("/user/:id", auth, async (req, res) => {
  let user = await Owner.findById(req.params.id).select("name role avatar phone email").catch(() => null);
  if (!user) user = await User.findById(req.params.id).select("name role avatar phone email").catch(() => null);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ name: user.name, role: user.role, avatar: user.avatar, phone: user.phone, email: user.email });
});

// Get unread message count for current user
router.get("/unread-count", auth, async (req, res) => {
  const count = await Message.countDocuments({ receiver_id: req.user.id, read: false });
  res.json({ count });
});

// Mark all messages from a sender as read
router.patch("/read/:sender_id", auth, async (req, res) => {
  await Message.updateMany(
    { sender_id: req.params.sender_id, receiver_id: req.user.id, read: false },
    { read: true }
  );
  res.json({ ok: true });
});

// Upload chat image to Cloudinary
router.post("/upload-image", auth, upload.single("image"), async (req, res) => {
  try {
    const result = await uploadToCloudinary(req.file.buffer, "flatkart/chat");
    res.json({ url: result.secure_url });
  } catch (err) {
    res.status(500).json({ message: "Image upload failed" });
  }
});

// Send a message
router.post("/", auth, async (req, res) => {
  const { receiver_id, text } = req.body;
  const message = await Message.create({ sender_id: req.user.id, receiver_id, text });
  res.json(message);
});

// Get messages between current user and another user
router.get("/messages/:other_id", auth, async (req, res) => {
  const { other_id } = req.params;
  const messages = await Message.find({
    $or: [
      { sender_id: req.user.id, receiver_id: other_id },
      { sender_id: other_id, receiver_id: req.user.id },
    ],
  }).sort("createdAt");
  res.json(messages);
});

// Get all unique conversations for current user
router.get("/conversations", auth, async (req, res) => {
  const messages = await Message.find({
    $or: [{ sender_id: req.user.id }, { receiver_id: req.user.id }],
  }).sort("-createdAt");

  const seen = new Set();
  const conversations = [];
  for (const m of messages) {
    const otherId = m.sender_id.toString() === req.user.id ? m.receiver_id.toString() : m.sender_id.toString();
    if (seen.has(otherId)) continue;
    seen.add(otherId);
    let other = await Owner.findById(otherId).select("name role avatar phone email").catch(() => null);
    if (!other) other = await User.findById(otherId).select("name role avatar phone email").catch(() => null);
    const unread = await Message.countDocuments({ sender_id: otherId, receiver_id: req.user.id, read: false });
    conversations.push({ userId: otherId, name: other?.name || "Unknown", role: other?.role || "", avatar: other?.avatar || "", phone: other?.phone || "", email: other?.email || "", lastMessage: m.text, lastTime: m.createdAt, unread });
  }
  res.json(conversations);
});

export default router;
