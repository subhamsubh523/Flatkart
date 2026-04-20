import jwt from "jsonwebtoken";

export default (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Access denied" });
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (verified.role !== "admin") return res.status(403).json({ message: "Admin access only" });
    req.admin = verified;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// e.g. requirePermission("owners:delete")
export const requirePermission = (permission) => (req, res, next) => {
  if (req.admin?.isSuperAdmin) return next();
  if (!req.admin?.permissions?.includes(permission))
    return res.status(403).json({ message: `Access denied. Requires '${permission}' permission.` });
  next();
};
