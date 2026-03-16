import { Hono } from "hono"
import jwt from "jsonwebtoken"
import { signup, login } from "../controllers/auth.controller.js"

const authRoutes = new Hono()

const JWT_SECRET = "secret_key"

authRoutes.post("/signup", signup)
authRoutes.post("/login", login)

/* =========================
   REFRESH TOKEN
========================= */

authRoutes.post("/refresh", async (c) => {
  const { refreshToken } = await c.req.json()

  if (!refreshToken) {
    return c.json({ message: "Refresh token required" }, 401)
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET)

    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      JWT_SECRET,
      { expiresIn: "15m" }
    )

    return c.json({
      accessToken: newAccessToken
    })

  } catch (error) {
    return c.json({ message: "Invalid refresh token" }, 401)
  }
})

export default authRoutes