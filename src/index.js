import { Hono } from "hono"
import { serve } from "@hono/node-server"
import { rateLimiter } from "hono-rate-limiter"
import { cors } from "hono/cors"

import authRoutes from "./routes/auth.routes.js"
import notesRoutes from "./routes/notes.routes.js"

import { errorHandler } from "./middleware/error.middleware.js"

const app = new Hono()

/* =========================
   GLOBAL MIDDLEWARE
========================= */

// CORS (IMPORTANT for frontend requests)
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
)

// Global error handler
app.use("*", errorHandler)

/* =========================
   RATE LIMITING
========================= */

app.use(
  "/auth/*",
  rateLimiter({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: true,
    keyGenerator: (c) => c.req.header("x-forwarded-for") || "anonymous"
  })
)

/* =========================
   ROOT ROUTE
========================= */

app.get("/", (c) => {
  return c.json({
    message: "Notes API running 🚀"
  })
})

/* =========================
   ROUTES
========================= */

app.route("/auth", authRoutes)
app.route("/notes", notesRoutes)

/* =========================
   SERVER START
========================= */

serve({
  fetch: app.fetch,
  port: process.env.PORT || 3000
})

console.log("🚀 Server running at http://localhost:3000")