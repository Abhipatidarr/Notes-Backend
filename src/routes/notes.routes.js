import { Hono } from "hono"
import { authMiddleware } from "../middleware/auth.middleware.js"

import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote
} from "../controllers/notes.controller.js"

const notes = new Hono()

notes.use("*", authMiddleware)

notes.post("/", createNote)
notes.get("/", getNotes)
notes.get("/:id", getNoteById)
notes.put("/:id", updateNote)
notes.delete("/:id", deleteNote)

export default notes