import { Hono } from "hono"
import jwt from "jsonwebtoken"
import prisma from "../db.js"
import { authMiddleware } from "../middleware/auth.middleware.js"
import {
  signup,
  login,
  oauthLogin,
  setupTwoFactor,
  verifyTwoFactor,
  logout
} from "../controllers/auth.controller.js"
import { JWT_SECRET, ACCESS_TOKEN_EXPIRES_IN } from "../config/auth.js"

const authRoutes = new Hono()

authRoutes.post("/signup", signup)
authRoutes.post("/login", login)
authRoutes.post("/oauth", oauthLogin)
authRoutes.post("/logout", logout)
authRoutes.post("/2fa/setup", authMiddleware, setupTwoFactor)
authRoutes.post("/2fa/verify", authMiddleware, verifyTwoFactor)

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
    const tokenInDb = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: decoded.userId,
        expiresAt: { gt: new Date() }
      }
    })
    if (!tokenInDb) {
      return c.json({ message: "Invalid refresh token" }, 401)
    }

    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    )

    return c.json({
      accessToken: newAccessToken
    })

  } catch (error) {
    return c.json({ message: "Invalid refresh token" }, 401)
  }
})

export default authRoutes