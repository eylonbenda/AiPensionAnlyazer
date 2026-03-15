-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Insert migration user for existing documents (password: changeme)
INSERT INTO "User" ("id", "email", "passwordHash", "name", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'migration@local.dev',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Migration User',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Add userId to Document as nullable, backfill, then set NOT NULL
ALTER TABLE "Document" ADD COLUMN "userId" TEXT;

UPDATE "Document"
SET "userId" = (SELECT "id" FROM "User" WHERE "email" = 'migration@local.dev' LIMIT 1);

ALTER TABLE "Document" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
