import { Hono } from "hono"
import { authMiddleware } from "../middleware/auth.middleware.js"

import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  togglePin,
  toggleArchive
} from "../controllers/notes.controller.js"

const notes = new Hono()

/* =========================
   AUTH MIDDLEWARE
========================= */

notes.use("*", authMiddleware)

/* =========================
   CREATE NOTE
========================= */

notes.post("/", createNote)

/* =========================
   GET ALL NOTES
========================= */

notes.get("/", getNotes)

/* =========================
   GET SINGLE NOTE
========================= */

notes.get("/:id", getNoteById)

/* =========================
   UPDATE NOTE
========================= */

notes.put("/:id", updateNote)

/* =========================
   DELETE NOTE
========================= */

notes.delete("/:id", deleteNote)

/* =========================
   PIN / UNPIN NOTE
========================= */

notes.patch("/:id/pin", togglePin)

/* =========================
   ARCHIVE / UNARCHIVE NOTE
========================= */
notes.patch("/:id/archive", toggleArchive)

export default notes