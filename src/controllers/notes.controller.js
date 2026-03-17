import prisma from "../db.js"
import { createNoteSchema, updateNoteSchema } from "../validators/note.validator.js"

const includeRelations = {
  folder: true,
  tags: {
    include: {
      tag: true
    }
  }
}

const upsertFolder = async (folderName, userId) => {
  if (!folderName?.trim()) return null
  return prisma.folder.upsert({
    where: {
      userId_name: {
        userId,
        name: folderName.trim()
      }
    },
    update: {},
    create: {
      name: folderName.trim(),
      userId
    }
  })
}

const syncTags = async ({ noteId, tags = [], userId }) => {
  await prisma.noteTag.deleteMany({ where: { noteId } })
  if (!tags.length) return

  for (const tagName of tags) {
    if (!tagName?.trim()) continue
    const tag = await prisma.tag.upsert({
      where: {
        userId_name: {
          userId,
          name: tagName.trim()
        }
      },
      update: {},
      create: {
        userId,
        name: tagName.trim()
      }
    })

    await prisma.noteTag.create({
      data: {
        noteId,
        tagId: tag.id
      }
    })
  }
}

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
  const folder = await upsertFolder(result.data.folderName, userId)

  const note = await prisma.note.create({
    data: {
      title: result.data.title,
      content: result.data.content ?? "",
      tag: result.data.tag,
      imageUrl: result.data.imageUrl || null,
      checklist: result.data.checklist || [],
      folderId: folder?.id ?? null,
      userId
    },
    include: includeRelations
  })

  await syncTags({ noteId: note.id, tags: result.data.tags || [], userId })

  const withRelations = await prisma.note.findUnique({
    where: { id: note.id },
    include: includeRelations
  })

  return c.json(withRelations)
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
  const folder = c.req.query("folder")

  const skip = (page - 1) * limit

  const notes = await prisma.note.findMany({
    where: {
      userId,
      archived,
      ...(pinnedOnly ? { pinned: true } : {}),
      ...(folder ? { folder: { name: folder } } : {}),
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
    include: includeRelations,
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
  const userId = c.get("userId")

  const note = await prisma.note.findFirst({
    where: {
      id,
      userId
    },
    include: includeRelations
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

  const folder = await upsertFolder(parsed.data.folderName, userId)

  const updatedNote = await prisma.note.update({
    where: { id },
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      tag: parsed.data.tag,
      imageUrl: parsed.data.imageUrl || null,
      checklist: parsed.data.checklist || [],
      archived: parsed.data.archived ?? note.archived,
      folderId: folder?.id ?? null
    },
    include: includeRelations
  })

  if (parsed.data.tags) {
    await syncTags({ noteId: id, tags: parsed.data.tags, userId })
  }

  const withRelations = await prisma.note.findUnique({
    where: { id },
    include: includeRelations
  })

  return c.json(withRelations || updatedNote)
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

/* =========================
   PIN NOTE
========================= */

export const togglePin = async (c) => {

  const id = parseInt(c.req.param("id"))
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

/* =========================
   TAGS / FOLDERS HELPERS
========================= */
export const getTags = async (c) => {
  const userId = c.get("userId")
  const tags = await prisma.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" }
  })
  return c.json({ tags })
}

export const createTag = async (c) => {
  const userId = c.get("userId")
  const { name, color } = await c.req.json()
  if (!name?.trim()) return c.json({ message: "Tag name required" }, 400)

  const tag = await prisma.tag.upsert({
    where: {
      userId_name: {
        userId,
        name: name.trim()
      }
    },
    update: {
      color: color || null
    },
    create: {
      userId,
      name: name.trim(),
      color: color || null
    }
  })

  return c.json(tag)
}

export const getFolders = async (c) => {
  const userId = c.get("userId")
  const folders = await prisma.folder.findMany({
    where: { userId },
    orderBy: { name: "asc" }
  })
  return c.json({ folders })
}

export const createFolder = async (c) => {
  const userId = c.get("userId")
  const { name } = await c.req.json()
  if (!name?.trim()) return c.json({ message: "Folder name required" }, 400)

  const folder = await prisma.folder.upsert({
    where: {
      userId_name: {
        userId,
        name: name.trim()
      }
    },
    update: {},
    create: {
      name: name.trim(),
      userId
    }
  })

  return c.json(folder)
}