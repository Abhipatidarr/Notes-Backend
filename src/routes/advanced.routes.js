import { Hono } from "hono"
import { authMiddleware } from "../middleware/auth.middleware.js"
import {
  createTemplate,
  getTemplates,
  summarizeNote,
  ocrExtract,
  speechToText,
  exportMarkdown,
  exportPdf,
  getNoteVersions,
  restoreVersion,
  applyTemplate
} from "../controllers/advanced.controller.js"

const advanced = new Hono()

advanced.use("*", authMiddleware)
advanced.post("/templates", createTemplate)
advanced.get("/templates", getTemplates)
advanced.post("/notes/:noteId/summarize", summarizeNote)
advanced.post("/ocr/extract", ocrExtract)
advanced.post("/speech/transcribe", speechToText)
advanced.get("/notes/:noteId/export/markdown", exportMarkdown)
advanced.get("/notes/:noteId/export/pdf", exportPdf)
advanced.get("/notes/:noteId/versions", getNoteVersions)
advanced.post("/versions/:versionId/restore", restoreVersion)
advanced.post("/templates/:templateId/apply", applyTemplate)

export default advanced
