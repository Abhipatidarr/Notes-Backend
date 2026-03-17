import { Hono } from "hono"
import { authMiddleware } from "../middleware/auth.middleware.js"

import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  togglePin,
  toggleArchive,
  getTags,
  createTag,
  getFolders,
  createFolder
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
   TAG ROUTES
========================= */
notes.get("/meta/tags", getTags)
notes.post("/meta/tags", createTag)

/* =========================
   FOLDER ROUTES
========================= */
notes.get("/meta/folders", getFolders)
notes.post("/meta/folders", createFolder)

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