import prisma from "../db.js"

export const shareNote = async (c) => {
  const userId = c.get("userId")
  const noteId = parseInt(c.req.param("noteId"))
  const { targetEmail, permission = "viewer" } = await c.req.json()

  const note = await prisma.note.findFirst({ where: { id: noteId, userId } })
  if (!note) return c.json({ message: "Note not found" }, 404)

  const share = await prisma.noteShare.create({
    data: { noteId, ownerId: userId, targetEmail, permission }
  })
  await prisma.activityLog.create({
    data: {
      userId,
      action: "note.shared",
      entity: "note",
      entityId: noteId,
      noteId,
      payload: { targetEmail, permission }
    }
  })
  return c.json(share, 201)
}

export const getSharedNotes = async (c) => {
  const userId = c.get("userId")
  const user = await prisma.user.findUnique({ where: { id: userId } })

  const shares = await prisma.noteShare.findMany({
    where: {
      OR: [{ ownerId: userId }, { targetEmail: user?.email || "" }]
    },
    include: {
      note: true
    },
    orderBy: { createdAt: "desc" }
  })
  return c.json({ shares })
}

export const addComment = async (c) => {
  const userId = c.get("userId")
  const noteId = parseInt(c.req.param("noteId"))
  const { body } = await c.req.json()
  if (!body?.trim()) return c.json({ message: "Comment body required" }, 400)

  const comment = await prisma.noteComment.create({
    data: { noteId, userId, body: body.trim() },
    include: {
      user: { select: { id: true, email: true } }
    }
  })
  await prisma.activityLog.create({
    data: {
      userId,
      action: "note.commented",
      entity: "note_comment",
      entityId: comment.id,
      noteId,
      payload: { body: comment.body }
    }
  })
  return c.json(comment, 201)
}

export const getComments = async (c) => {
  const noteId = parseInt(c.req.param("noteId"))
  const comments = await prisma.noteComment.findMany({
    where: { noteId },
    include: { user: { select: { id: true, email: true } } },
    orderBy: { createdAt: "asc" }
  })
  return c.json({ comments })
}

export const getActivityHistory = async (c) => {
  const userId = c.get("userId")
  const activity = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100
  })
  return c.json({ activity })
}

export const realtimePoll = async (c) => {
  const userId = c.get("userId")
  const since = c.req.query("since")
  const sinceDate = since ? new Date(since) : new Date(Date.now() - 60 * 1000)
  const [notes, comments] = await Promise.all([
    prisma.note.findMany({
      where: { userId, updatedAt: { gt: sinceDate } },
      orderBy: { updatedAt: "desc" },
      take: 30
    }),
    prisma.noteComment.findMany({
      where: { createdAt: { gt: sinceDate } },
      include: { user: { select: { id: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50
    })
  ])
  return c.json({ serverTime: new Date().toISOString(), notes, comments })
}
