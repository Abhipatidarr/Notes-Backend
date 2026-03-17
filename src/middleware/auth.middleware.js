import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../config/auth.js"

export const authMiddleware = async (c, next) => {
  const authHeader = c.req.header("Authorization")

  if (!authHeader) {
    return c.json({ message: "Unauthorized" }, 401)
  }

  const token = authHeader.split(" ")[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET)

    c.set("userId", decoded.userId)

    await next()
  } catch (error) {
    return c.json({ message: "Invalid token" }, 401)
  }
}