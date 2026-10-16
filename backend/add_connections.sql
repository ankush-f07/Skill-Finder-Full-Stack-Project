CREATE TABLE "Connection" (
    "id" SERIAL NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Connection_receiverId_status_idx"
ON "Connection"("receiverId", "status");

CREATE UNIQUE INDEX "Connection_senderId_receiverId_key"
ON "Connection"("senderId", "receiverId");

ALTER TABLE "Connection"
ADD CONSTRAINT "Connection_senderId_fkey"
FOREIGN KEY ("senderId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Connection"
ADD CONSTRAINT "Connection_receiverId_fkey"
FOREIGN KEY ("receiverId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;