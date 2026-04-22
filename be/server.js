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

app.use(express.json({ limit: "10mb" }));
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

// userId -> Set of socketIds (supports multiple tabs)
const onlineUsers = new Map();

io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    socket.join(userId);
    socket.userId = userId;
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);
    // Broadcast to everyone that this user is online
    io.emit("user_online", userId);
  });

  socket.on("send_message", ({ receiver_id, message }) => {
    const msg = { ...message, sender_id: message.sender_id?.toString(), receiver_id: message.receiver_id?.toString() };
    io.to(receiver_id).emit("receive_message", msg);
    io.to(receiver_id).emit("new_conversation");
    io.to(msg.sender_id).emit("receive_message", msg);
  });

  socket.on("disconnect", () => {
    const userId = socket.userId;
    if (!userId) return;
    const sockets = onlineUsers.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        // Broadcast to everyone that this user is offline
        io.emit("user_offline", userId);
      }
    }
  });

  // Let a newly connected client know who is currently online
  socket.on("get_online_users", () => {
    socket.emit("online_users", [...onlineUsers.keys()]);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`https://localhost:${PORT}`));
