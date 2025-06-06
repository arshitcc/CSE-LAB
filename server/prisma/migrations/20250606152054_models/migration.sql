-- CreateEnum
CREATE TYPE "UserRoles" AS ENUM ('ADMIN', 'PLAYLIST_ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "UserAuthTypes" AS ENUM ('CREDENTIALS', 'GOOGLE', 'GITHUB');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "Languages" AS ENUM ('C', 'CPP', 'JAVA', 'PYTHON', 'JAVASCRIPT');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('ACCEPTED', 'WRONG_ANSWER', 'RUNTIME_ERROR', 'MEMORY_LIMIT_EXCEEDED', 'TIME_LIMIT_EXCEEDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullname" TEXT,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" JSONB,
    "role" "UserRoles" NOT NULL DEFAULT 'USER',
    "loginType" "UserAuthTypes" NOT NULL DEFAULT 'CREDENTIALS',
    "isEmailVerified" BOOLEAN,
    "emailVerificationToken" TEXT,
    "emailVerificationExpiry" TIMESTAMP(3),
    "forgotPasswordToken" TEXT,
    "forgotPasswordExpiry" TIMESTAMP(3),
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "tags" TEXT[],
    "hints" TEXT,
    "editorial" TEXT,
    "examples" JSONB[],
    "attachments" JSONB[],
    "constraints" JSONB[],
    "preCodeSnippets" JSONB[],
    "referenceSolutions" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "language" "Languages" NOT NULL,
    "submittedCode" TEXT NOT NULL,
    "status" "ResultStatus" NOT NULL,
    "stdin" TEXT,
    "stdout" TEXT,
    "stderr" TEXT,
    "compileOutput" TEXT,
    "time" DOUBLE PRECISION,
    "memory" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCaseResult" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "isPassed" BOOLEAN NOT NULL,
    "status" "ResultStatus" NOT NULL,
    "output" TEXT NOT NULL,
    "stdout" TEXT,
    "stderr" TEXT,
    "compileOutput" TEXT,
    "time" DOUBLE PRECISION,
    "memory" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestCaseResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCase" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolvedProblems" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolvedProblems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Playlist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "desciption" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistProblems" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaylistProblems_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Problem_createdById_idx" ON "Problem"("createdById");

-- CreateIndex
CREATE INDEX "Submission_submittedById_idx" ON "Submission"("submittedById");

-- CreateIndex
CREATE INDEX "Submission_problemId_idx" ON "Submission"("problemId");

-- CreateIndex
CREATE INDEX "TestCaseResult_submissionId_idx" ON "TestCaseResult"("submissionId");

-- CreateIndex
CREATE INDEX "TestCaseResult_testCaseId_idx" ON "TestCaseResult"("testCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "TestCase_problemId_input_key" ON "TestCase"("problemId", "input");

-- CreateIndex
CREATE INDEX "SolvedProblems_userId_idx" ON "SolvedProblems"("userId");

-- CreateIndex
CREATE INDEX "SolvedProblems_problemId_idx" ON "SolvedProblems"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "SolvedProblems_userId_problemId_key" ON "SolvedProblems"("userId", "problemId");

-- CreateIndex
CREATE UNIQUE INDEX "Playlist_name_createdById_key" ON "Playlist"("name", "createdById");

-- CreateIndex
CREATE INDEX "PlaylistProblems_playlistId_idx" ON "PlaylistProblems"("playlistId");

-- CreateIndex
CREATE INDEX "PlaylistProblems_problemId_idx" ON "PlaylistProblems"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistProblems_playlistId_problemId_key" ON "PlaylistProblems"("playlistId", "problemId");

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCaseResult" ADD CONSTRAINT "TestCaseResult_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolvedProblems" ADD CONSTRAINT "SolvedProblems_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolvedProblems" ADD CONSTRAINT "SolvedProblems_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistProblems" ADD CONSTRAINT "PlaylistProblems_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistProblems" ADD CONSTRAINT "PlaylistProblems_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
