-- Cleanup script for legacy tables/columns.
-- Run this in Supabase SQL Editor (or psql) once.
-- It keeps only: User, Note, RefreshToken, _prisma_migrations.

BEGIN;

-- Drop legacy tables no longer used by app/backend.
DROP TABLE IF EXISTS "ActivityLog" CASCADE;
DROP TABLE IF EXISTS "BackupSnapshot" CASCADE;
DROP TABLE IF EXISTS "Folder" CASCADE;
DROP TABLE IF EXISTS "NoteComment" CASCADE;
DROP TABLE IF EXISTS "NoteShare" CASCADE;
DROP TABLE IF EXISTS "NoteTag" CASCADE;
DROP TABLE IF EXISTS "NoteTemplate" CASCADE;
DROP TABLE IF EXISTS "NoteVersion" CASCADE;
DROP TABLE IF EXISTS "Reminder" CASCADE;
DROP TABLE IF EXISTS "Tag" CASCADE;
DROP TABLE IF EXISTS "Task" CASCADE;

-- Remove legacy columns from Note.
ALTER TABLE "Note" DROP COLUMN IF EXISTS "tag";
ALTER TABLE "Note" DROP COLUMN IF EXISTS "latitude";
ALTER TABLE "Note" DROP COLUMN IF EXISTS "longitude";
ALTER TABLE "Note" DROP COLUMN IF EXISTS "reminderMinutes";
ALTER TABLE "Note" DROP COLUMN IF EXISTS "reminderNotificationId";
ALTER TABLE "Note" DROP COLUMN IF EXISTS "fileUrl";
ALTER TABLE "Note" DROP COLUMN IF EXISTS "order";
ALTER TABLE "Note" DROP COLUMN IF EXISTS "isLocked";
ALTER TABLE "Note" DROP COLUMN IF EXISTS "lockHint";
ALTER TABLE "Note" DROP COLUMN IF EXISTS "encryptedContent";
ALTER TABLE "Note" DROP COLUMN IF EXISTS "folderId";

-- Remove legacy columns from User.
ALTER TABLE "User" DROP COLUMN IF EXISTS "oauthProvider";
ALTER TABLE "User" DROP COLUMN IF EXISTS "oauthId";
ALTER TABLE "User" DROP COLUMN IF EXISTS "twoFactorCode";

COMMIT;
