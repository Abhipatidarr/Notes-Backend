import prisma from "../db.js"
import { createTaskSchema, updateTaskSchema } from "../validators/task.validator.js"

const includeTask = {
  subtasks: true,
  note: {
    select: { id: true, title: true }
  }
}

const addActivity = (userId, action, entity, entityId, payload = null) =>
  prisma.activityLog.create({
    data: { userId, action, entity, entityId, payload }
  })

export const createTask = async (c) => {
  const userId = c.get("userId")
  const body = await c.req.json()
  const parsed = createTaskSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.errors }, 400)

  const task = await prisma.task.create({
    data: {
      title: parsed.data.title,
      completed: parsed.data.completed ?? false,
      priority: parsed.data.priority ?? "medium",
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      recurring: parsed.data.recurring || null,
      reminderAt: parsed.data.reminderAt ? new Date(parsed.data.reminderAt) : null,
      noteId: parsed.data.noteId ?? null,
      parentId: parsed.data.parentId ?? null,
      assignedToId: parsed.data.assignedToId ?? null,
      userId
    },
    include: includeTask
  })

  await addActivity(userId, "task.created", "task", task.id, { title: task.title })
  return c.json(task, 201)
}

export const getTasks = async (c) => {
  const userId = c.get("userId")
  const completed = c.req.query("completed")
  const priority = c.req.query("priority")
  const search = c.req.query("search") || ""

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      parentId: null,
      ...(completed !== undefined ? { completed: completed === "true" } : {}),
      ...(priority ? { priority } : {}),
      title: {
        contains: search,
        mode: "insensitive"
      }
    },
    include: includeTask,
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }]
  })

  return c.json({ tasks })
}

export const updateTask = async (c) => {
  const userId = c.get("userId")
  const id = parseInt(c.req.param("id"))
  const body = await c.req.json()
  const parsed = updateTaskSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.errors }, 400)

  const existing = await prisma.task.findFirst({ where: { id, userId } })
  if (!existing) return c.json({ message: "Task not found" }, 404)

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...("title" in parsed.data ? { title: parsed.data.title } : {}),
      ...("completed" in parsed.data ? { completed: parsed.data.completed } : {}),
      ...("priority" in parsed.data ? { priority: parsed.data.priority } : {}),
      ...("dueDate" in parsed.data
        ? { dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null }
        : {}),
      ...("recurring" in parsed.data ? { recurring: parsed.data.recurring || null } : {}),
      ...("reminderAt" in parsed.data
        ? { reminderAt: parsed.data.reminderAt ? new Date(parsed.data.reminderAt) : null }
        : {}),
      ...("noteId" in parsed.data ? { noteId: parsed.data.noteId ?? null } : {}),
      ...("parentId" in parsed.data ? { parentId: parsed.data.parentId ?? null } : {}),
      ...("assignedToId" in parsed.data
        ? { assignedToId: parsed.data.assignedToId ?? null }
        : {})
    },
    include: includeTask
  })

  await addActivity(userId, "task.updated", "task", task.id, parsed.data)
  return c.json(task)
}

export const deleteTask = async (c) => {
  const userId = c.get("userId")
  const id = parseInt(c.req.param("id"))
  const existing = await prisma.task.findFirst({ where: { id, userId } })
  if (!existing) return c.json({ message: "Task not found" }, 404)

  await prisma.task.delete({ where: { id } })
  await addActivity(userId, "task.deleted", "task", id)
  return c.json({ message: "Task deleted" })
}

export const reorderTasks = async (c) => {
  const userId = c.get("userId")
  const { orderedIds = [] } = await c.req.json()
  if (!Array.isArray(orderedIds)) {
    return c.json({ message: "orderedIds must be array" }, 400)
  }

  await Promise.all(
    orderedIds.map((id, index) =>
      prisma.task.updateMany({
        where: { id: Number(id), userId },
        data: { order: index }
      })
    )
  )

  await addActivity(userId, "task.reordered", "task", null, { orderedIds })
  return c.json({ message: "Tasks reordered" })
}
