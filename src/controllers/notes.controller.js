import prisma from "../db.js"
import { createNoteSchema, updateNoteSchema } from "../validators/note.validator.js"

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
      title: result.data.title,
      content: result.data.content ?? "",
      imageUrl: result.data.imageUrl || null,
      checklist: result.data.checklist || [],
      pinned: result.data.pinned ?? false,
      archived: result.data.archived ?? false,
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
  const limit = parseInt(c.req.query("limit")) || 10
  const search = c.req.query("search") || ""
  const sortBy = c.req.query("sortBy") || "date"
  const pinnedOnly = c.req.query("pinnedOnly") === "true"
  const archived = c.req.query("archived") === "true"

  const skip = (page - 1) * limit

  const notes = await prisma.note.findMany({
    where: {
      userId,
      archived,
      ...(pinnedOnly ? { pinned: true } : {}),
      OR: [
        {
          title: {
            contains: search,
            mode: "insensitive"
          }
        },
        {
          content: {
            contains: search,
            mode: "insensitive"
          }
        }
      ]
    },
    skip,
    take: limit,
    orderBy:
      sortBy === "title"
        ? [{ pinned: "desc" }, { title: "asc" }]
        : [{ pinned: "desc" }, { updatedAt: "desc" }]
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
  if (Number.isNaN(id)) return c.json({ message: "Invalid note id" }, 400)
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
  if (Number.isNaN(id)) return c.json({ message: "Invalid note id" }, 400)
  const userId = c.get("userId")
  const body = await c.req.json()
  const parsed = updateNoteSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({
      error: parsed.error.errors
    }, 400)
  }

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
      title: parsed.data.title,
      content: parsed.data.content,
      imageUrl: parsed.data.imageUrl || null,
      checklist: parsed.data.checklist || [],
      archived: parsed.data.archived ?? note.archived,
      pinned: parsed.data.pinned ?? note.pinned
    }
  })
  return c.json(updatedNote)
}

/* =========================
   DELETE NOTE
========================= */

export const deleteNote = async (c) => {
  const id = parseInt(c.req.param("id"))
  if (Number.isNaN(id)) return c.json({ message: "Invalid note id" }, 400)
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

/* =========================
   PIN NOTE
========================= */

export const togglePin = async (c) => {

  const id = parseInt(c.req.param("id"))
  if (Number.isNaN(id)) return c.json({ message: "Invalid note id" }, 400)
  const userId = c.get("userId")

  const note = await prisma.note.findFirst({
    where:{ id, userId }
  })

  if(!note){
    return c.json({message:"Note not found"},404)
  }

  const updated = await prisma.note.update({
    where:{ id },
    data:{ pinned: !note.pinned }
  })

  return c.json(updated)
}

/* =========================
   ARCHIVE / UNARCHIVE NOTE
========================= */
export const toggleArchive = async (c) => {
  const id = parseInt(c.req.param("id"))
  if (Number.isNaN(id)) return c.json({ message: "Invalid note id" }, 400)
  const userId = c.get("userId")

  const note = await prisma.note.findFirst({
    where: { id, userId }
  })

  if (!note) {
    return c.json({ message: "Note not found" }, 404)
  }

  const updated = await prisma.note.update({
    where: { id },
    data: { archived: !note.archived }
  })

  return c.json(updated)
}