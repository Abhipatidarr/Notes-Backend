import { z } from "zod"

export const createNoteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().default(""),
  imageUrl: z.string().url().optional().nullable(),
  checklist: z.array(z.object({
    text: z.string(),
    completed: z.boolean().default(false)
  })).optional(),
  pinned: z.boolean().optional(),
  archived: z.boolean().optional()
})

export const updateNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  imageUrl: z.string().url().optional().nullable(),
  checklist: z.array(z.object({
    text: z.string(),
    completed: z.boolean().default(false)
  })).optional(),
  archived: z.boolean().optional(),
  pinned: z.boolean().optional()
})