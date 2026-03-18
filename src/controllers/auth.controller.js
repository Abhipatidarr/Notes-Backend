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
  const body = await c.req.json()
  const email = String(body?.email || "").trim().toLowerCase()
  const password = String(body?.password || "")

  if (!email || !password) {
    return c.json({ message: "Email and password are required" }, 400)
  }
  if (password.length < 6) {
    return c.json({ message: "Password must be at least 6 characters" }, 400)
  }

  const exists = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  })
  if (exists) {
    return c.json({ message: "Email already registered" }, 409)
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword
    },
    select: {
      id: true
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
    const body = await c.req.json()
    const email = String(body?.email || "").trim().toLowerCase()
    const password = String(body?.password || "")

    if (!email || !password) {
      return c.json({ message: "Email and password are required" }, 400)
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        password: true
      }
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

export const logout = async (c) => {
  const { refreshToken } = await c.req.json()
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
  }
  return c.json({ message: "Logged out" })
}