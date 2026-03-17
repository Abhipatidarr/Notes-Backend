import { Hono } from "hono"
import { authMiddleware } from "../middleware/auth.middleware.js"
import {
  createReminder,
  getReminders,
  dailySummary,
  createBackup,
  restoreBackup,
  syncChanges,
  sendEmailReminder,
  sendPushNotification
} from "../controllers/system.controller.js"

const system = new Hono()

system.use("*", authMiddleware)
system.post("/reminders", createReminder)
system.get("/reminders", getReminders)
system.get("/summary/daily", dailySummary)
system.post("/backup", createBackup)
system.post("/backup/restore", restoreBackup)
system.get("/sync", syncChanges)
system.post("/email/reminder", sendEmailReminder)
system.post("/push/send", sendPushNotification)

export default system
