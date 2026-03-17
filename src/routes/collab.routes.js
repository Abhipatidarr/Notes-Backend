import { Hono } from "hono"
import { authMiddleware } from "../middleware/auth.middleware.js"
import {
  shareNote,
  getSharedNotes,
  addComment,
  getComments,
  getActivityHistory,
  realtimePoll
} from "../controllers/collab.controller.js"

const collab = new Hono()

collab.use("*", authMiddleware)
collab.post("/notes/:noteId/share", shareNote)
collab.get("/notes/shared", getSharedNotes)
collab.post("/notes/:noteId/comments", addComment)
collab.get("/notes/:noteId/comments", getComments)
collab.get("/activity", getActivityHistory)
collab.get("/realtime/poll", realtimePoll)

export default collab
