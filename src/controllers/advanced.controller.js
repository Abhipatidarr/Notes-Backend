import prisma from "../db.js"

export const createTemplate = async (c) => {
  const userId = c.get("userId")
  const { name, title, content } = await c.req.json()
  if (!name || !title) return c.json({ message: "name and title are required" }, 400)

  const template = await prisma.noteTemplate.create({
    data: { userId, name, title, content: content || "" }
  })
  return c.json(template, 201)
}

export const getTemplates = async (c) => {
  const userId = c.get("userId")
  const templates = await prisma.noteTemplate.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" }
  })
  return c.json({ templates })
}

export const summarizeNote = async (c) => {
  const userId = c.get("userId")
  const noteId = parseInt(c.req.param("noteId"))
  const note = await prisma.note.findFirst({ where: { id: noteId, userId } })
  if (!note) return c.json({ message: "Note not found" }, 404)

  const content = note.content || ""
  const sentences = content.split(/[.!?]/).map((s) => s.trim()).filter(Boolean)
  const summary = sentences.slice(0, 3).join(". ") || "No content available to summarize."
  return c.json({ summary })
}

export const ocrExtract = async (c) => {
  const { imageUrl } = await c.req.json()
  return c.json({
    message: "OCR provider not configured. Add integration key and implement provider call.",
    extractedText: imageUrl ? `OCR placeholder for: ${imageUrl}` : ""
  })
}

export const speechToText = async (c) => {
  const { audioUrl } = await c.req.json()
  return c.json({
    message: "Speech-to-text provider not configured. Endpoint scaffolded.",
    text: audioUrl ? `Transcription placeholder for ${audioUrl}` : ""
  })
}

export const exportMarkdown = async (c) => {
  const userId = c.get("userId")
  const noteId = parseInt(c.req.param("noteId"))
  const note = await prisma.note.findFirst({ where: { id: noteId, userId } })
  if (!note) return c.json({ message: "Note not found" }, 404)

  const markdown = `# ${note.title}\n\n${note.content}\n`
  return c.json({ markdown, filename: `note-${note.id}.md` })
}

export const exportPdf = async (c) => {
  const userId = c.get("userId")
  const noteId = parseInt(c.req.param("noteId"))
  const note = await prisma.note.findFirst({ where: { id: noteId, userId } })
  if (!note) return c.json({ message: "Note not found" }, 404)

  return c.json({
    message: "PDF export scaffold ready. Integrate a PDF generator for binary files.",
    printableText: `${note.title}\n\n${note.content}`,
    filename: `note-${note.id}.pdf`
  })
}

export const getNoteVersions = async (c) => {
  const userId = c.get("userId")
  const noteId = parseInt(c.req.param("noteId"))
  const note = await prisma.note.findFirst({ where: { id: noteId, userId } })
  if (!note) return c.json({ message: "Note not found" }, 404)

  const versions = await prisma.noteVersion.findMany({
    where: { noteId },
    orderBy: { createdAt: "desc" }
  })
  return c.json({ versions })
}

export const restoreVersion = async (c) => {
  const userId = c.get("userId")
  const versionId = parseInt(c.req.param("versionId"))
  const version = await prisma.noteVersion.findUnique({ where: { id: versionId } })
  if (!version) return c.json({ message: "Version not found" }, 404)

  const note = await prisma.note.findFirst({ where: { id: version.noteId, userId } })
  if (!note) return c.json({ message: "Note not found" }, 404)

  const updated = await prisma.note.update({
    where: { id: note.id },
    data: { title: version.title, content: version.content }
  })
  return c.json(updated)
}

export const applyTemplate = async (c) => {
  const userId = c.get("userId")
  const templateId = parseInt(c.req.param("templateId"))
  const template = await prisma.noteTemplate.findFirst({
    where: { id: templateId, userId }
  })
  if (!template) return c.json({ message: "Template not found" }, 404)

  const note = await prisma.note.create({
    data: {
      userId,
      title: template.title,
      content: template.content
    }
  })
  return c.json(note, 201)
}
