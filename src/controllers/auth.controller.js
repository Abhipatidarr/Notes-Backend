import prisma from "../db.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import {
  JWT_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN
} from "../config/auth.js"

const buildTokens = async (userId) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  })

  const refreshToken = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  })

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  })

  return { accessToken, refreshToken }
}

/* =========================
   SIGNUP
========================= */

export const signup = async (c) => {
  const { email, password } = await c.req.json()

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    return c.json({ message: "Email already registered" }, 409)
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword
    }
  })

  const { accessToken, refreshToken } = await buildTokens(user.id)

  return c.json({
    message: "User created",
    accessToken,
    refreshToken
  })
}


/* =========================
   LOGIN
========================= */

export const login = async (c) => {
  try {

    const { email, password } = await c.req.json()

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return c.json({ message: "User not found" }, 401)
    }

    if (!user.password) {
      return c.json({ message: "Password not set" }, 500)
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return c.json({ message: "Invalid password" }, 401)
    }

    const accessToken = jwt.sign(
      { userId: user.id }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    )
    const refreshToken = jwt.sign(
      { userId: user.id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    )

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })

    return c.json({
      message: "Login successful",
      accessToken,
      refreshToken
    })

  } catch (error) {

    console.log("LOGIN ERROR:", error)

    return c.json({
      message: "Server error"
    }, 500)

  }
}

export const oauthLogin = async (c) => {
  const { email, provider = "google", oauthId } = await c.req.json()
  if (!email || !oauthId) {
    return c.json({ message: "email and oauthId are required" }, 400)
  }

  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(`${provider}:${oauthId}`, 10),
        oauthProvider: provider,
        oauthId
      }
    })
  }

  const { accessToken, refreshToken } = await buildTokens(user.id)
  return c.json({ accessToken, refreshToken, message: "OAuth login successful" })
}

export const setupTwoFactor = async (c) => {
  const userId = c.get("userId")
  const code = `${Math.floor(100000 + Math.random() * 900000)}`
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorCode: code }
  })
  return c.json({
    message: "2FA code generated. Integrate SMS/email provider to deliver this code.",
    code
  })
}

export const verifyTwoFactor = async (c) => {
  const userId = c.get("userId")
  const { code } = await c.req.json()
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.twoFactorCode !== code) {
    return c.json({ message: "Invalid 2FA code" }, 400)
  }
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorCode: null }
  })
  return c.json({ message: "2FA verification successful" })
}

export const logout = async (c) => {
  const { refreshToken } = await c.req.json()
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
  }
  return c.json({ message: "Logged out" })
}