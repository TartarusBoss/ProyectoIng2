import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "changeme";

export function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "no token" });
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "invalid token" });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || (role !== "any" && req.user.role !== role)) {
      return res.status(403).json({ error: "forbidden" });
    }
    next();
  };
}
