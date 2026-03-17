import { z } from "zod"

export const createNoteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().default(""),
  tag: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
  fileUrl: z.string().url().optional().nullable(),
  checklist: z.array(z.object({
    text: z.string(),
    completed: z.boolean().default(false)
  })).optional(),
  folderName: z.string().optional().nullable(),
  tags: z.array(z.string()).optional()
})

export const updateNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  tag: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
  fileUrl: z.string().url().optional().nullable(),
  checklist: z.array(z.object({
    text: z.string(),
    completed: z.boolean().default(false)
  })).optional(),
  folderName: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  archived: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  lockHint: z.string().optional().nullable()
})