import jwt from "jsonwebtoken";
import User from "../models/User.js";

const resolveUserFromToken = async (authorizationHeader) => {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return User.findById(decoded.userId);
};

export const protect = async (req, res, next) => {
  try {
    const user = await resolveUserFromToken(req.headers.authorization);

    if (!user) {
      return res.status(401).json({ message: "Authorization token is required." });
    }

    req.user = user;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

export const optionalAuth = async (req, _res, next) => {
  try {
    const user = await resolveUserFromToken(req.headers.authorization);

    if (user) {
      req.user = user;
    }

    return next();
  } catch (_error) {
    return next();
  }
};
