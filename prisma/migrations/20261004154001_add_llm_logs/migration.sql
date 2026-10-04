-- CreateTable
CREATE TABLE "llm_logs" (
    "id" SERIAL NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,

    CONSTRAINT "llm_logs_pkey" PRIMARY KEY ("id")
);
