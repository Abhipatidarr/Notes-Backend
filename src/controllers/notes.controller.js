import prisma from "../db.js"
import { createNoteSchema } from "../validators/note.validator.js"

/* =========================
   CREATE NOTE
========================= */


export const createNote = async (c) => {
  const body = await c.req.json()

  const result = createNoteSchema.safeParse(body)

  if (!result.success) {
    return c.json({
      error: result.error.errors
    }, 400)
  }

  const userId = c.get("userId")

  const note = await prisma.note.create({
    data: {
      ...result.data,
      userId
    }
  })

  return c.json(note)
}

/* =========================
   GET ALL NOTES
========================= */

export const getNotes = async (c) => {
  const userId = c.get("userId")

  const page = parseInt(c.req.query("page")) || 1
  const limit = parseInt(c.req.query("limit")) || 5

  const skip = (page - 1) * limit

  const notes = await prisma.note.findMany({
    where: { userId },
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc"
    }
  })

  return c.json({
    page,
    limit,
    notes
  })
}

/* =========================
   GET SINGLE NOTE
========================= */

export const getNoteById = async (c) => {
  const id = parseInt(c.req.param("id"))
  const userId = c.get("userId")

  const note = await prisma.note.findFirst({
    where: {
      id,
      userId
    }
  })

  if (!note) {
    return c.json({ message: "Note not found" }, 404)
  }

  return c.json(note)
}

/* =========================
   UPDATE NOTE
========================= */

export const updateNote = async (c) => {
  const id = parseInt(c.req.param("id"))
  const userId = c.get("userId")
  const { title, content } = await c.req.json()

  const note = await prisma.note.findFirst({
    where: {
      id,
      userId
    }
  })

  if (!note) {
    return c.json({ message: "Note not found or unauthorized" }, 404)
  }

  const updatedNote = await prisma.note.update({
    where: { id },
    data: {
      title,
      content
    }
  })

  return c.json(updatedNote)
}

/* =========================
   DELETE NOTE
========================= */

export const deleteNote = async (c) => {
  const id = parseInt(c.req.param("id"))
  const userId = c.get("userId")

  const note = await prisma.note.findFirst({
    where: {
      id,
      userId
    }
  })

  if (!note) {
    return c.json({ message: "Note not found or unauthorized" }, 404)
  }

  await prisma.note.delete({
    where: { id }
  })

  return c.json({
    message: "Note deleted successfully"
  })
}