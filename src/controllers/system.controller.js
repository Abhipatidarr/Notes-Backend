import prisma from "../db.js"

export const createReminder = async (c) => {
  const userId = c.get("userId")
  const { title, remindAt, noteId, taskId } = await c.req.json()
  if (!title || !remindAt) {
    return c.json({ message: "title and remindAt are required" }, 400)
  }
  const reminder = await prisma.reminder.create({
    data: {
      title,
      remindAt: new Date(remindAt),
      noteId: noteId || null,
      taskId: taskId || null,
      userId
    }
  })
  return c.json(reminder, 201)
}

export const getReminders = async (c) => {
  const userId = c.get("userId")
  const reminders = await prisma.reminder.findMany({
    where: { userId },
    orderBy: { remindAt: "asc" }
  })
  return c.json({ reminders })
}

export const dailySummary = async (c) => {
  const userId = c.get("userId")
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const tomorrow = new Date(todayStart)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const tasksDue = await prisma.task.count({
    where: {
      userId,
      dueDate: { gte: todayStart, lt: tomorrow },
      completed: false
    }
  })

  const notesUpdated = await prisma.note.count({
    where: {
      userId,
      updatedAt: { gte: todayStart, lt: tomorrow }
    }
  })

  return c.json({
    summary: `You updated ${notesUpdated} notes and have ${tasksDue} tasks due today.`,
    tasksDue,
    notesUpdated
  })
}

export const createBackup = async (c) => {
  const userId = c.get("userId")
  const [notes, tasks, folders, tags] = await Promise.all([
    prisma.note.findMany({ where: { userId } }),
    prisma.task.findMany({ where: { userId } }),
    prisma.folder.findMany({ where: { userId } }),
    prisma.tag.findMany({ where: { userId } })
  ])

  const backup = await prisma.backupSnapshot.create({
    data: {
      userId,
      payload: { notes, tasks, folders, tags }
    }
  })
  return c.json(backup, 201)
}

export const restoreBackup = async (c) => {
  const userId = c.get("userId")
  const { backupId } = await c.req.json()
  const backup = await prisma.backupSnapshot.findFirst({
    where: { id: Number(backupId), userId }
  })
  if (!backup) return c.json({ message: "Backup not found" }, 404)
  return c.json({
    message: "Backup payload retrieved. Automated restore requires conflict-safe import tooling.",
    payload: backup.payload
  })
}

export const syncChanges = async (c) => {
  const userId = c.get("userId")
  const since = c.req.query("since")
  const sinceDate = since ? new Date(since) : new Date(0)

  const [notes, tasks] = await Promise.all([
    prisma.note.findMany({ where: { userId, updatedAt: { gt: sinceDate } } }),
    prisma.task.findMany({ where: { userId, updatedAt: { gt: sinceDate } } })
  ])

  return c.json({
    serverTime: new Date().toISOString(),
    notes,
    tasks
  })
}

export const sendEmailReminder = async (c) => {
  const { email, subject, body } = await c.req.json()
  return c.json({
    message: "Email provider not configured yet. Endpoint scaffolded.",
    preview: { email, subject, body }
  })
}

export const sendPushNotification = async (c) => {
  const { expoPushToken, title, body } = await c.req.json()
  return c.json({
    message: "Push service not configured yet. Endpoint scaffolded.",
    preview: { expoPushToken, title, body }
  })
}
