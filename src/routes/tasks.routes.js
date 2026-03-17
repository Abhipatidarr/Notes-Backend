import { Hono } from "hono"
import { authMiddleware } from "../middleware/auth.middleware.js"
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  reorderTasks
} from "../controllers/tasks.controller.js"

const tasks = new Hono()

tasks.use("*", authMiddleware)
tasks.post("/", createTask)
tasks.get("/", getTasks)
tasks.patch("/reorder", reorderTasks)
tasks.put("/:id", updateTask)
tasks.patch("/:id", updateTask)
tasks.delete("/:id", deleteTask)

export default tasks
