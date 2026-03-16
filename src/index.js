import { Hono } from "hono"
import { serve } from "@hono/node-server"
import { rateLimiter } from "hono-rate-limiter"

import authRoutes from "./routes/auth.routes.js"
import notesRoutes from "./routes/notes.routes.js"

import { errorHandler } from "./middleware/error.middleware.js"

const app = new Hono()

/* =========================
   GLOBAL MIDDLEWARE
========================= */

// Global error handler
app.use("*", errorHandler)

/* =========================
   RATE LIMITING
========================= */

// Limit auth routes (login/signup)
app.use(
  "/auth/*",
  rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    limit: 10,           // max 10 requests
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
  port: 3000
})

console.log("🚀 Server running at http://localhost:3000")