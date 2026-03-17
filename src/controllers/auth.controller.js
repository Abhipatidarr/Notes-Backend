import prisma from "../db.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const JWT_SECRET = "secret_key"

/* =========================
   SIGNUP
========================= */

export const signup = async (c) => {
  const { email, password } = await c.req.json()

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword
    }
  })

  const accessToken = jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: "15m" }
  )

  const refreshToken = jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: "7d" }
  )

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
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: "15m" }
    )

    return c.json({
      message: "Login successful",
      accessToken
    })

  } catch (error) {

    console.log("LOGIN ERROR:", error)

    return c.json({
      message: "Server error"
    }, 500)

  }
}