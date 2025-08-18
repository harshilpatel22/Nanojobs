-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'MANDATE_SETUP', 'ESCROWED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "BronzeTaskCategory" AS ENUM ('DATA_ENTRY', 'CONTENT_CREATION', 'CUSTOMER_SERVICE', 'RESEARCH', 'BASIC_DESIGN', 'BASIC_FINANCE');

-- CreateEnum
CREATE TYPE "TrialTaskCategory" AS ENUM ('DATA_ENTRY', 'CONTENT', 'ORGANIZATION', 'RESEARCH', 'COMMUNICATION');

-- CreateEnum
CREATE TYPE "MandateStatus" AS ENUM ('ACTIVE', 'PAUSED', 'EXPIRED', 'CANCELLED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('WORKER', 'EMPLOYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "BadgeLevel" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('FRESHER', 'JUNIOR', 'EXPERIENCED', 'SENIOR');

-- CreateEnum
CREATE TYPE "RegistrationMethod" AS ENUM ('RESUME', 'QUIZ', 'MANUAL', 'BASIC_INFO');

-- CreateEnum
CREATE TYPE "IDDocumentType" AS ENUM ('AADHAR', 'DRIVING_LICENSE');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('DRAFT', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'ACCEPTED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EmployerType" AS ENUM ('INDIVIDUAL', 'SMALL_BUSINESS', 'COMPANY');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RaterType" AS ENUM ('WORKER', 'EMPLOYER');

-- CreateEnum
CREATE TYPE "TaskSubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT NOT NULL,
    "userType" "UserType" NOT NULL DEFAULT 'WORKER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "password" TEXT,
    "passwordSet" BOOLEAN NOT NULL DEFAULT false,
    "lastPasswordChange" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "workerId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "mandateId" TEXT,
    "upiId" TEXT,
    "workerUpiId" TEXT,
    "transactionId" TEXT,
    "escrowedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "escrowMethod" TEXT,
    "bankName" TEXT,
    "paymentNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upi_mandates" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "upiId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountLast4" TEXT NOT NULL,
    "mandateRef" TEXT NOT NULL,
    "maxAmount" DECIMAL(10,2) NOT NULL DEFAULT 50000.00,
    "dailyLimit" DECIMAL(10,2) NOT NULL DEFAULT 10000.00,
    "monthlyLimit" DECIMAL(10,2) NOT NULL DEFAULT 100000.00,
    "status" "MandateStatus" NOT NULL DEFAULT 'ACTIVE',
    "validUntil" TIMESTAMP(3) NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upi_mandates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "idDocumentType" "IDDocumentType",
    "idDocumentNumber" TEXT,
    "idDocumentUrl" TEXT,
    "isIdVerified" BOOLEAN NOT NULL DEFAULT false,
    "idVerifiedAt" TIMESTAMP(3),
    "verificationMethod" TEXT,
    "badge" "BadgeLevel" NOT NULL DEFAULT 'BRONZE',
    "badgeReason" TEXT,
    "skills" TEXT[],
    "experienceLevel" "ExperienceLevel" NOT NULL DEFAULT 'FRESHER',
    "estimatedHourlyRate" INTEGER NOT NULL DEFAULT 120,
    "registrationMethod" "RegistrationMethod" NOT NULL DEFAULT 'BASIC_INFO',
    "isKYCCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "availability" TEXT NOT NULL DEFAULT 'available',
    "preferredCategories" TEXT[],
    "registrationPath" TEXT NOT NULL DEFAULT 'resume',
    "hasResume" BOOLEAN NOT NULL DEFAULT false,
    "educationLevel" TEXT,
    "availableHours" INTEGER,
    "previousWork" TEXT,
    "averageAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "averageSpeed" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "trialTasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "trialTasksPassed" INTEGER NOT NULL DEFAULT 0,
    "bronzeBadgeEarned" BOOLEAN NOT NULL DEFAULT false,
    "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'english',
    "mentorAssigned" TEXT,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DECIMAL(65,30),
    "workingHoursStart" TEXT DEFAULT '09:00',
    "workingHoursEnd" TEXT DEFAULT '18:00',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "upiId" TEXT,
    "bankName" TEXT,
    "totalEarnings" DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT "workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trial_tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "TrialTaskCategory" NOT NULL,
    "payAmount" DECIMAL(8,2) NOT NULL,
    "timeLimit" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'beginner',
    "accuracyThreshold" DOUBLE PRECISION NOT NULL DEFAULT 90.0,
    "speedThreshold" DOUBLE PRECISION,
    "qualityChecklist" JSONB NOT NULL,
    "sampleData" JSONB NOT NULL,
    "instructions" TEXT NOT NULL,
    "expectedOutput" JSONB NOT NULL,
    "autoGrading" BOOLEAN NOT NULL DEFAULT true,
    "manualReview" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trial_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bronze_task_applications" (
    "id" TEXT NOT NULL,
    "bronzeTaskId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "message" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bronze_task_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_applications" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "message" TEXT,
    "proposedRate" DECIMAL(65,30),
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "task_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trial_task_submissions" (
    "id" TEXT NOT NULL,
    "trialTaskId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "submittedWork" JSONB NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "accuracyScore" DOUBLE PRECISION,
    "speedScore" DOUBLE PRECISION,
    "qualityScore" DOUBLE PRECISION,
    "feedback" TEXT,
    "autoEvaluated" BOOLEAN NOT NULL DEFAULT false,
    "manuallyReviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "trial_task_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "whatsappGroupId" TEXT,
    "whatsappInviteLink" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "memberLimit" INTEGER NOT NULL DEFAULT 100,
    "currentMembers" INTEGER NOT NULL DEFAULT 0,
    "language" TEXT NOT NULL DEFAULT 'english',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_memberships" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "community_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employerType" "EmployerType" NOT NULL DEFAULT 'INDIVIDUAL',
    "companyName" TEXT,
    "website" TEXT,
    "description" TEXT,
    "businessCategory" TEXT NOT NULL DEFAULT 'other',
    "expectedTaskVolume" TEXT NOT NULL DEFAULT 'low',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verificationNote" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "tasksPosted" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "averageRating" DECIMAL(65,30),
    "freeTasksUsed" INTEGER NOT NULL DEFAULT 0,
    "hasUsedFreeTasks" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "upiId" TEXT,
    "bankName" TEXT,
    "totalEarnings" DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT "employers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "textContent" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "basicInfo" JSONB NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_results" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL DEFAULT 30,
    "timeTaken" INTEGER,
    "evaluatedBy" TEXT NOT NULL DEFAULT 'ai',
    "aiConfidence" INTEGER,
    "aiSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badge_history" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "fromBadge" "BadgeLevel",
    "toBadge" "BadgeLevel" NOT NULL,
    "reason" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badge_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bronze_tasks" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "BronzeTaskCategory" NOT NULL,
    "duration" INTEGER NOT NULL,
    "payAmount" DECIMAL(8,2) NOT NULL,
    "difficulty" TEXT NOT NULL,
    "isFreeTask" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxApplications" INTEGER NOT NULL DEFAULT 100,
    "skillTags" TEXT[],
    "minAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 95.0,
    "minTasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "industry" TEXT,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "templates" JSONB,
    "instructionLanguage" TEXT NOT NULL DEFAULT 'english',
    "hasVoiceInstructions" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bronze_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "raterType" "RaterType" NOT NULL,
    "workerId" TEXT,
    "employerId" TEXT,
    "ratedWorkerId" TEXT,
    "ratedEmployerId" TEXT,
    "stars" INTEGER NOT NULL,
    "ratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_attachments" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_submissions" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "submissionType" TEXT NOT NULL,
    "textContent" TEXT,
    "submissionData" JSONB,
    "status" "TaskSubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "previousVersionId" TEXT,

    CONSTRAINT "task_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_submission_files" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "description" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_submission_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_chats" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "encryptedContent" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digilocker_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aadhaarNumber" TEXT NOT NULL,
    "verifiedName" TEXT NOT NULL,
    "verifiedDob" TEXT,
    "verifiedAddress" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verificationMethod" TEXT NOT NULL DEFAULT 'digilocker',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "digilocker_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL DEFAULT 'worker',
    "state" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CompletedBy" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "upi_mandates_mandateRef_key" ON "upi_mandates"("mandateRef");

-- CreateIndex
CREATE UNIQUE INDEX "workers_userId_key" ON "workers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "workers_idDocumentNumber_key" ON "workers"("idDocumentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "bronze_task_applications_bronzeTaskId_workerId_key" ON "bronze_task_applications"("bronzeTaskId", "workerId");

-- CreateIndex
CREATE UNIQUE INDEX "task_applications_taskId_workerId_key" ON "task_applications"("taskId", "workerId");

-- CreateIndex
CREATE UNIQUE INDEX "community_memberships_workerId_groupId_key" ON "community_memberships"("workerId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "employers_userId_key" ON "employers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "resumes_workerId_key" ON "resumes"("workerId");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_results_workerId_key" ON "quiz_results"("workerId");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_applicationId_key" ON "ratings"("applicationId");

-- CreateIndex
CREATE INDEX "ratings_taskId_idx" ON "ratings"("taskId");

-- CreateIndex
CREATE INDEX "ratings_workerId_idx" ON "ratings"("workerId");

-- CreateIndex
CREATE INDEX "ratings_employerId_idx" ON "ratings"("employerId");

-- CreateIndex
CREATE INDEX "ratings_ratedWorkerId_idx" ON "ratings"("ratedWorkerId");

-- CreateIndex
CREATE INDEX "ratings_ratedEmployerId_idx" ON "ratings"("ratedEmployerId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- CreateIndex
CREATE UNIQUE INDEX "task_submissions_applicationId_key" ON "task_submissions"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "task_chats_taskId_key" ON "task_chats"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "digilocker_verifications_userId_key" ON "digilocker_verifications"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "_CompletedBy_AB_unique" ON "_CompletedBy"("A", "B");

-- CreateIndex
CREATE INDEX "_CompletedBy_B_index" ON "_CompletedBy"("B");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "bronze_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_mandateId_fkey" FOREIGN KEY ("mandateId") REFERENCES "upi_mandates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upi_mandates" ADD CONSTRAINT "upi_mandates_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workers" ADD CONSTRAINT "workers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bronze_task_applications" ADD CONSTRAINT "bronze_task_applications_bronzeTaskId_fkey" FOREIGN KEY ("bronzeTaskId") REFERENCES "bronze_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bronze_task_applications" ADD CONSTRAINT "bronze_task_applications_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_applications" ADD CONSTRAINT "task_applications_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "bronze_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_applications" ADD CONSTRAINT "task_applications_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_task_submissions" ADD CONSTRAINT "trial_task_submissions_trialTaskId_fkey" FOREIGN KEY ("trialTaskId") REFERENCES "trial_tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_task_submissions" ADD CONSTRAINT "trial_task_submissions_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_memberships" ADD CONSTRAINT "community_memberships_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_memberships" ADD CONSTRAINT "community_memberships_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "community_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employers" ADD CONSTRAINT "employers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_results" ADD CONSTRAINT "quiz_results_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_history" ADD CONSTRAINT "badge_history_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bronze_tasks" ADD CONSTRAINT "bronze_tasks_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "bronze_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "task_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_ratedWorkerId_fkey" FOREIGN KEY ("ratedWorkerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_ratedEmployerId_fkey" FOREIGN KEY ("ratedEmployerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "bronze_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_submissions" ADD CONSTRAINT "task_submissions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "bronze_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_submissions" ADD CONSTRAINT "task_submissions_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_submissions" ADD CONSTRAINT "task_submissions_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "bronze_task_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_submissions" ADD CONSTRAINT "task_submissions_previousVersionId_fkey" FOREIGN KEY ("previousVersionId") REFERENCES "task_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_submission_files" ADD CONSTRAINT "task_submission_files_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "task_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_chats" ADD CONSTRAINT "task_chats_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "bronze_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_chats" ADD CONSTRAINT "task_chats_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_chats" ADD CONSTRAINT "task_chats_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "task_chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompletedBy" ADD CONSTRAINT "_CompletedBy_A_fkey" FOREIGN KEY ("A") REFERENCES "bronze_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompletedBy" ADD CONSTRAINT "_CompletedBy_B_fkey" FOREIGN KEY ("B") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
