import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export default (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Access denied" });
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { ...verified, id: verified.id?.toString() };
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
