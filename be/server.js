import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./configure/db.js";
import authRoutes from "./routes/authRoutes.js";
import flatRoutes from "./routes/flatRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

connectDB();

const app = express();

app.use(express.json());
app.use(cors());

app.use("/uploads", express.static("uploads"));
app.use("/api/auth", authRoutes);
app.use("/api/flats", flatRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("Server Running");
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  socket.on("join", (userId) => socket.join(userId));
  socket.on("send_message", ({ receiver_id, message }) => {
    const msg = { ...message, sender_id: message.sender_id?.toString(), receiver_id: message.receiver_id?.toString() };
    // Deliver to receiver
    io.to(receiver_id).emit("receive_message", msg);
    // Notify receiver's sidebar of new conversation
    io.to(receiver_id).emit("new_conversation");
    // Echo back to sender's own room (other tabs/devices)
    io.to(msg.sender_id).emit("receive_message", msg);
  });
  socket.on("disconnect", () => {});
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`https://localhost:${PORT}`));
