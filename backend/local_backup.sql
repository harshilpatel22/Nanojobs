--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13 (Homebrew)
-- Dumped by pg_dump version 15.13 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: ApplicationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ApplicationStatus" AS ENUM (
    'APPLIED',
    'ACCEPTED',
    'REJECTED',
    'COMPLETED'
);


--
-- Name: BadgeLevel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BadgeLevel" AS ENUM (
    'BRONZE',
    'SILVER',
    'GOLD',
    'PLATINUM'
);


--
-- Name: BronzeTaskCategory; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BronzeTaskCategory" AS ENUM (
    'DATA_ENTRY',
    'CONTENT_CREATION',
    'CUSTOMER_SERVICE',
    'RESEARCH',
    'BASIC_DESIGN',
    'BASIC_FINANCE'
);


--
-- Name: EmployerType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EmployerType" AS ENUM (
    'INDIVIDUAL',
    'SMALL_BUSINESS',
    'COMPANY'
);


--
-- Name: ExperienceLevel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ExperienceLevel" AS ENUM (
    'FRESHER',
    'JUNIOR',
    'EXPERIENCED',
    'SENIOR'
);


--
-- Name: MandateStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MandateStatus" AS ENUM (
    'ACTIVE',
    'PAUSED',
    'EXPIRED',
    'CANCELLED',
    'SUSPENDED'
);


--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'MANDATE_SETUP',
    'ESCROWED',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'REFUNDED',
    'DISPUTED'
);


--
-- Name: RaterType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RaterType" AS ENUM (
    'WORKER',
    'EMPLOYER'
);


--
-- Name: RegistrationMethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RegistrationMethod" AS ENUM (
    'RESUME',
    'QUIZ',
    'MANUAL'
);


--
-- Name: TaskStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TaskStatus" AS ENUM (
    'DRAFT',
    'AVAILABLE',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: TaskSubmissionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TaskSubmissionStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'REVISION_REQUESTED',
    'APPROVED',
    'REJECTED'
);


--
-- Name: TrialTaskCategory; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TrialTaskCategory" AS ENUM (
    'DATA_ENTRY',
    'CONTENT',
    'ORGANIZATION',
    'RESEARCH',
    'COMMUNICATION'
);


--
-- Name: UserType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserType" AS ENUM (
    'WORKER',
    'EMPLOYER',
    'ADMIN'
);


--
-- Name: VerificationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."VerificationStatus" AS ENUM (
    'PENDING',
    'VERIFIED',
    'REJECTED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _CompletedBy; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."_CompletedBy" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


--
-- Name: badge_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.badge_history (
    id text NOT NULL,
    "workerId" text NOT NULL,
    "fromBadge" public."BadgeLevel",
    "toBadge" public."BadgeLevel" NOT NULL,
    reason text NOT NULL,
    source text NOT NULL,
    "assignedBy" text,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: bronze_task_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bronze_task_applications (
    id text NOT NULL,
    "bronzeTaskId" text NOT NULL,
    "workerId" text NOT NULL,
    status public."ApplicationStatus" DEFAULT 'APPLIED'::public."ApplicationStatus" NOT NULL,
    message text,
    "appliedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: bronze_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bronze_tasks (
    id text NOT NULL,
    "employerId" text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    category public."BronzeTaskCategory" NOT NULL,
    duration integer NOT NULL,
    "payAmount" numeric(8,2) NOT NULL,
    difficulty text NOT NULL,
    "skillTags" text[],
    "minAccuracy" double precision DEFAULT 95.0 NOT NULL,
    "minTasksCompleted" integer DEFAULT 0 NOT NULL,
    industry text,
    recurring boolean DEFAULT false NOT NULL,
    templates jsonb,
    "instructionLanguage" text DEFAULT 'english'::text NOT NULL,
    "hasVoiceInstructions" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id text NOT NULL,
    "chatId" text NOT NULL,
    "senderId" text NOT NULL,
    "senderType" text NOT NULL,
    "encryptedContent" text NOT NULL,
    "messageType" text DEFAULT 'text'::text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: community_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_groups (
    id text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    "whatsappGroupId" text,
    "whatsappInviteLink" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "memberLimit" integer DEFAULT 100 NOT NULL,
    "currentMembers" integer DEFAULT 0 NOT NULL,
    language text DEFAULT 'english'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: community_memberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.community_memberships (
    id text NOT NULL,
    "workerId" text NOT NULL,
    "groupId" text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


--
-- Name: employers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employers (
    id text NOT NULL,
    "userId" text NOT NULL,
    "employerType" public."EmployerType" DEFAULT 'INDIVIDUAL'::public."EmployerType" NOT NULL,
    "companyName" text,
    website text,
    description text,
    "businessCategory" text DEFAULT 'other'::text NOT NULL,
    "expectedTaskVolume" text DEFAULT 'low'::text NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "verificationStatus" public."VerificationStatus" DEFAULT 'PENDING'::public."VerificationStatus" NOT NULL,
    "verificationNote" text,
    "verifiedAt" timestamp(3) without time zone,
    "tasksPosted" integer DEFAULT 0 NOT NULL,
    "totalSpent" numeric(65,30) DEFAULT 0.00 NOT NULL,
    "averageRating" numeric(65,30),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "upiId" text,
    "bankName" text,
    "totalEarnings" numeric(10,2) DEFAULT 0.00 NOT NULL
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id text NOT NULL,
    "taskId" text NOT NULL,
    "employerId" text NOT NULL,
    "workerId" text,
    amount numeric(10,2) NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "mandateId" text,
    "upiId" text,
    "workerUpiId" text,
    "transactionId" text,
    "escrowedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "refundedAt" timestamp(3) without time zone,
    "escrowMethod" text,
    "bankName" text,
    "paymentNote" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: quiz_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_results (
    id text NOT NULL,
    "workerId" text NOT NULL,
    answers jsonb NOT NULL,
    "totalScore" integer NOT NULL,
    "maxScore" integer DEFAULT 30 NOT NULL,
    "timeTaken" integer,
    "evaluatedBy" text DEFAULT 'ai'::text NOT NULL,
    "aiConfidence" integer,
    "aiSource" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ratings (
    id text NOT NULL,
    "taskId" text NOT NULL,
    "applicationId" text NOT NULL,
    "raterType" public."RaterType" NOT NULL,
    "workerId" text,
    "employerId" text,
    "ratedWorkerId" text,
    "ratedEmployerId" text,
    stars integer NOT NULL,
    "ratedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isVisible" boolean DEFAULT true NOT NULL
);


--
-- Name: resumes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resumes (
    id text NOT NULL,
    "workerId" text NOT NULL,
    "originalName" text NOT NULL,
    "fileName" text NOT NULL,
    "filePath" text NOT NULL,
    "fileSize" integer NOT NULL,
    "mimeType" text NOT NULL,
    "textContent" text NOT NULL,
    metadata jsonb NOT NULL,
    "basicInfo" jsonb NOT NULL,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastUsed" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metadata jsonb
);


--
-- Name: system_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_config (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    description text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: task_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_applications (
    id text NOT NULL,
    "taskId" text NOT NULL,
    "workerId" text NOT NULL,
    status public."ApplicationStatus" DEFAULT 'APPLIED'::public."ApplicationStatus" NOT NULL,
    message text,
    "proposedRate" numeric(65,30),
    "appliedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "respondedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone
);


--
-- Name: task_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_attachments (
    id text NOT NULL,
    "taskId" text NOT NULL,
    "fileName" text NOT NULL,
    "filePath" text NOT NULL,
    "fileSize" integer NOT NULL,
    "mimeType" text NOT NULL,
    "fileType" text NOT NULL,
    description text,
    "isRequired" boolean DEFAULT false NOT NULL,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: task_chats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_chats (
    id text NOT NULL,
    "taskId" text NOT NULL,
    "workerId" text NOT NULL,
    "employerId" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: task_submission_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_submission_files (
    id text NOT NULL,
    "submissionId" text NOT NULL,
    "fileName" text NOT NULL,
    "filePath" text NOT NULL,
    "fileSize" integer NOT NULL,
    "mimeType" text NOT NULL,
    "fileType" text NOT NULL,
    description text,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: task_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_submissions (
    id text NOT NULL,
    "taskId" text NOT NULL,
    "workerId" text NOT NULL,
    "applicationId" text NOT NULL,
    "submissionType" text NOT NULL,
    "textContent" text,
    "submissionData" jsonb,
    status public."TaskSubmissionStatus" DEFAULT 'SUBMITTED'::public."TaskSubmissionStatus" NOT NULL,
    "submittedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "reviewedAt" timestamp(3) without time zone,
    "reviewNote" text,
    version integer DEFAULT 1 NOT NULL,
    "isLatest" boolean DEFAULT true NOT NULL,
    "previousVersionId" text
);


--
-- Name: trial_task_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trial_task_submissions (
    id text NOT NULL,
    "trialTaskId" text NOT NULL,
    "workerId" text NOT NULL,
    "submittedWork" jsonb NOT NULL,
    "timeSpent" integer NOT NULL,
    "submittedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    passed boolean DEFAULT false NOT NULL,
    "accuracyScore" double precision,
    "speedScore" double precision,
    "qualityScore" double precision,
    feedback text,
    "autoEvaluated" boolean DEFAULT false NOT NULL,
    "manuallyReviewed" boolean DEFAULT false NOT NULL,
    "reviewedBy" text,
    "reviewedAt" timestamp(3) without time zone
);


--
-- Name: trial_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trial_tasks (
    id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    category public."TrialTaskCategory" NOT NULL,
    "payAmount" numeric(8,2) NOT NULL,
    "timeLimit" integer NOT NULL,
    difficulty text DEFAULT 'beginner'::text NOT NULL,
    "accuracyThreshold" double precision DEFAULT 90.0 NOT NULL,
    "speedThreshold" double precision,
    "qualityChecklist" jsonb NOT NULL,
    "sampleData" jsonb NOT NULL,
    instructions text NOT NULL,
    "expectedOutput" jsonb NOT NULL,
    "autoGrading" boolean DEFAULT true NOT NULL,
    "manualReview" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: upi_mandates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.upi_mandates (
    id text NOT NULL,
    "employerId" text NOT NULL,
    "upiId" text NOT NULL,
    "bankName" text NOT NULL,
    "accountLast4" text NOT NULL,
    "mandateRef" text NOT NULL,
    "maxAmount" numeric(10,2) DEFAULT 50000.00 NOT NULL,
    "dailyLimit" numeric(10,2) DEFAULT 10000.00 NOT NULL,
    "monthlyLimit" numeric(10,2) DEFAULT 100000.00 NOT NULL,
    status public."MandateStatus" DEFAULT 'ACTIVE'::public."MandateStatus" NOT NULL,
    "validUntil" timestamp(3) without time zone NOT NULL,
    "isVerified" boolean DEFAULT true NOT NULL,
    "verifiedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    phone text NOT NULL,
    email text,
    name text NOT NULL,
    "userType" public."UserType" DEFAULT 'WORKER'::public."UserType" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: workers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workers (
    id text NOT NULL,
    "userId" text NOT NULL,
    badge public."BadgeLevel" DEFAULT 'BRONZE'::public."BadgeLevel" NOT NULL,
    "badgeReason" text,
    skills text[],
    "experienceLevel" public."ExperienceLevel" DEFAULT 'FRESHER'::public."ExperienceLevel" NOT NULL,
    "estimatedHourlyRate" integer DEFAULT 120 NOT NULL,
    "registrationMethod" public."RegistrationMethod" NOT NULL,
    "isKYCCompleted" boolean DEFAULT false NOT NULL,
    "isPhoneVerified" boolean DEFAULT false NOT NULL,
    "isEmailVerified" boolean DEFAULT false NOT NULL,
    availability text DEFAULT 'available'::text NOT NULL,
    "preferredCategories" text[],
    "registrationPath" text DEFAULT 'resume'::text NOT NULL,
    "hasResume" boolean DEFAULT false NOT NULL,
    "educationLevel" text,
    "availableHours" integer,
    "previousWork" text,
    "averageAccuracy" double precision DEFAULT 0.0 NOT NULL,
    "averageSpeed" double precision DEFAULT 0.0 NOT NULL,
    "trialTasksCompleted" integer DEFAULT 0 NOT NULL,
    "trialTasksPassed" integer DEFAULT 0 NOT NULL,
    "bronzeBadgeEarned" boolean DEFAULT false NOT NULL,
    "whatsappOptIn" boolean DEFAULT false NOT NULL,
    "preferredLanguage" text DEFAULT 'english'::text NOT NULL,
    "mentorAssigned" text,
    "tasksCompleted" integer DEFAULT 0 NOT NULL,
    "averageRating" numeric(65,30),
    "workingHoursStart" text DEFAULT '09:00'::text,
    "workingHoursEnd" text DEFAULT '18:00'::text,
    timezone text DEFAULT 'Asia/Kolkata'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "upiId" text,
    "bankName" text,
    "totalEarnings" numeric(10,2) DEFAULT 0.00 NOT NULL
);


--
-- Data for Name: _CompletedBy; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."_CompletedBy" ("A", "B") FROM stdin;
\.


--
-- Data for Name: badge_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.badge_history (id, "workerId", "fromBadge", "toBadge", reason, source, "assignedBy", "assignedAt") FROM stdin;
cme340fib00071t4s8ffzkmuo	cme340fhv00031t4s3yafg523	\N	SILVER	Strong technical skills, multiple advanced projects, internship experience, leadership in technical competitions, demonstrating potential beyond entry-level	resume_analysis	\N	2025-08-08 17:38:19.878
cme60zodi0005yx1ky6ot0uyz	cme60zodb0003yx1k1cdqqb5o	\N	BRONZE	Earned Bronze badge with 1/1 trials passed. Continue practicing to improve your skills.	trial_tasks_evaluation	\N	2025-08-10 18:37:04.406
cme612nkc000dyx1kh08i7h1n	cme612nk8000byx1kyijp6m1z	\N	BRONZE	Earned Bronze badge with 1/1 trials passed. Continue practicing to improve your skills.	trial_tasks_evaluation	\N	2025-08-10 18:39:23.334
cme618e2r000nyx1kdshwtpny	cme618e24000jyx1kq8wuhhzy	\N	SILVER	Strong technical skills, diverse project experience, research internship, and multiple achievements demonstrate potential beyond entry-level	resume_analysis	\N	2025-08-10 18:43:50.949
\.


--
-- Data for Name: bronze_task_applications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bronze_task_applications (id, "bronzeTaskId", "workerId", status, message, "appliedAt") FROM stdin;
cmebra8280003qx9cxol1hm99	cme8u65aa0005saf1vks3ssg4	cme60zodb0003yx1k1cdqqb5o	COMPLETED	I'm interested in this business task.	2025-08-14 18:51:57.393
cmebram800005qx9cxrevkd0h	cme8tjko80004itf5w58dnu2p	cme60zodb0003yx1k1cdqqb5o	COMPLETED	I'm interested in this business task.	2025-08-14 18:52:15.745
cmebsaybe000b10t38d4iuog6	cmebs9lw6000510t376dd894o	cme60zodb0003yx1k1cdqqb5o	COMPLETED	I'm interested in this business task.	2025-08-14 19:20:31.035
cmechqz1a000bx57uedj6678v	cmechq5pk0005x57u6vuvn90n	cme60zodb0003yx1k1cdqqb5o	COMPLETED	I'm interested in this business task.	2025-08-15 07:12:48.862
cmed2kvac000bk8yczw9jwai8	cmed2jury0005k8ycwqgrwvtq	cme60zodb0003yx1k1cdqqb5o	COMPLETED	I'm interested in this business task.	2025-08-15 16:55:56.005
cmed4ntbn000bzqc9m61n1qpw	cmed4l9zg0003zqc98mfzwwcf	cme60zodb0003yx1k1cdqqb5o	COMPLETED	I'm interested in this business task.	2025-08-15 17:54:12.659
cmed8o446000dgrnyylkd25sm	cmed8ne0z0007grnyrxaol4n2	cme60zodb0003yx1k1cdqqb5o	COMPLETED	I'm interested in this business task.	2025-08-15 19:46:25.11
cmed9pbfq0003i0mxc1cqhnp1	cmed99wsa0005bgy0z6840t7f	cme60zodb0003yx1k1cdqqb5o	COMPLETED	I'm interested in this business task.	2025-08-15 20:15:20.87
cmeda5oec0003gymxbw5t5phm	cmed9zlue000510byns284kum	cme60zodb0003yx1k1cdqqb5o	APPLIED	I'm interested in this business task.	2025-08-15 20:28:04.164
cmeeijy1j000rz43tgdfof71z	cmeeihflq000lz43thc8f4wf4	cme60zodb0003yx1k1cdqqb5o	COMPLETED	I'm interested in this business task.	2025-08-16 17:10:52.951
cmeeli45t000brs9y7e647srs	cmeelhj1s0005rs9yfb14fzh0	cme60zodb0003yx1k1cdqqb5o	ACCEPTED	I'm interested in this business task.	2025-08-16 18:33:26.418
\.


--
-- Data for Name: bronze_tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bronze_tasks (id, "employerId", title, description, category, duration, "payAmount", difficulty, "skillTags", "minAccuracy", "minTasksCompleted", industry, recurring, templates, "instructionLanguage", "hasVoiceInstructions", "createdAt", "updatedAt") FROM stdin;
cme8tjko80004itf5w58dnu2p	cme8ssq980003uovgmfs0acbu	Data entry	Simple data entry required, No skill required. Need fast data entry	DATA_ENTRY	240	800.00	intermediate	{Excel,"Data Entry","Attention to Detail"}	95	0	general	f	null	english	f	2025-08-12 17:31:54.342	2025-08-12 17:31:54.342
cme8u65aa0005saf1vks3ssg4	cme8ssq980003uovgmfs0acbu	Content lala	Content creation and aot of it hehehehehehehehehehe	DATA_ENTRY	240	800.00	intermediate	{content}	95	0	general	f	\N	english	f	2025-08-12 17:49:27.482	2025-08-12 17:49:27.482
cmebs9lw6000510t376dd894o	cme8ssq980003uovgmfs0acbu	Data entry	ABCDEFGhsoisndoinvsdoivndoivnvoinvodisnvdsoinvdsoinsoidndsoinv	DATA_ENTRY	120	800.00	advanced	{data}	95	0	general	f	\N	english	f	2025-08-14 19:19:28.275	2025-08-14 19:19:28.275
cmechq5pk0005x57u6vuvn90n	cme8ssq980003uovgmfs0acbu	Please give good ratinf	testetsteetsetestestestestestesteteestetstestesettestse	BASIC_DESIGN	120	400.00	intermediate	{rate}	95	0	general	f	\N	english	f	2025-08-15 07:12:10.851	2025-08-15 07:12:10.851
cmed2jury0005k8ycwqgrwvtq	cmed17tc000033oz9sh80yhgx	Test task0	teeovovdnfofndfovnfdoivnfoindfoinvfdoinvdfoifnvoidfnvdofin	CONTENT_CREATION	120	800.00	advanced	{testing}	95	0	general	f	\N	english	f	2025-08-15 16:55:08.686	2025-08-15 16:55:08.686
cmed4l9zg0003zqc98mfzwwcf	cmed17tc000033oz9sh80yhgx	soidnoinoin	vdiofnvsdoinvadiovnoivndodfinfdoivndfoivndfovndfoivnvodfnv	DATA_ENTRY	120	400.00	beginner	{soinv}	95	0	general	f	\N	english	f	2025-08-15 17:52:14.284	2025-08-15 17:52:14.284
cmed8ne0z0007grnyrxaol4n2	cmed0yrq70005ct6zynkn5icz	Test2xinoc	oxccn xo ionocnsoicndsodncoidsncdoincdocidnsodincdosincdsoicndsocndoicn	BASIC_FINANCE	240	2000.00	beginner	{finance}	95	0	general	f	\N	english	f	2025-08-15 19:45:51.3	2025-08-15 19:45:51.3
cmed99wsa0005bgy0z6840t7f	cmed0yrq70005ct6zynkn5icz	test303030	sdoivndsiocnsoivnsviodsnvoidnvdoivndfiovndfoivndfiovndfoi	BASIC_FINANCE	120	2000.00	beginner	{hehe}	95	0	general	f	\N	english	f	2025-08-15 20:03:22.042	2025-08-15 20:03:22.042
cmed9zlue000510byns284kum	cmed0yrq70005ct6zynkn5icz	test4304093490	dfuvdvfiuaadfnviuuvinfdfvunvudfinfvuivfnudfvuindfvuaafdvufvdiun	BASIC_DESIGN	240	1600.00	beginner	{yoyooyo}	95	0	general	f	\N	english	f	2025-08-15 20:23:20.918	2025-08-15 20:23:20.918
cmeeihflq000lz43thc8f4wf4	cmedagfuo0003kkbdwo4o8sbi	Logo design	Design aesthetic snoicndodsnionvdsoivndoinvoinvoinvdionvdo	CUSTOMER_SERVICE	240	800.00	beginner	{logo}	95	0	general	f	\N	english	f	2025-08-16 17:08:55.731	2025-08-16 17:08:55.731
cmeelhj1s0005rs9yfb14fzh0	cmedagfuo0003kkbdwo4o8sbi	chat testing	oxncdoicndovndfionvofdnfiovdnoidfvnfdoinv oidnv oinvnio	CONTENT_CREATION	240	6400.00	beginner	{chat}	95	0	general	f	\N	english	f	2025-08-16 18:32:59.056	2025-08-16 18:32:59.056
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_messages (id, "chatId", "senderId", "senderType", "encryptedContent", "messageType", "isRead", "isDeleted", "createdAt") FROM stdin;
cmeepd49e000312wrmgutgcxp	cmeelkoh700018iw5u9zbm2z9	cme60zod60001yx1ksy05vzb8	worker	1cbc2eaea26abf58a05ad65b3125c1c5:9dbc1ec5ac030e1be14c5835c20d1da8:c1b9f91fd6	text	t	f	2025-08-16 20:21:31.73
cmeepdpls000712wrfaec8plt	cmeelkoh700018iw5u9zbm2z9	cme612nk60009yx1kgqonmviw	employer	74b54ad37fe4c6361bab219f258a90c3:0e0625c3e777dd9711b548adb4b20ce8:beec	text	f	f	2025-08-16 20:21:59.392
cmeepeg9a000912wr0nikuy6h	cmeelkoh700018iw5u9zbm2z9	cme612nk60009yx1kgqonmviw	employer	6de3fb7ce237d9b6f20addd28d4793fd:551fbc3fd18106cadcc230580cb5be4b:9943	text	f	f	2025-08-16 20:22:33.934
\.


--
-- Data for Name: community_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.community_groups (id, name, description, category, "whatsappGroupId", "whatsappInviteLink", "isActive", "memberLimit", "currentMembers", language, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: community_memberships; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.community_memberships (id, "workerId", "groupId", role, "joinedAt", "isActive") FROM stdin;
\.


--
-- Data for Name: employers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employers (id, "userId", "employerType", "companyName", website, description, "businessCategory", "expectedTaskVolume", "isVerified", "verificationStatus", "verificationNote", "verifiedAt", "tasksPosted", "totalSpent", "averageRating", "createdAt", "updatedAt", "upiId", "bankName", "totalEarnings") FROM stdin;
cme8ssq980003uovgmfs0acbu	cme8ssq950001uovg7maxef8w	COMPANY	Honey Singh Entp	\N	\N	design	medium	f	PENDING	\N	\N	4	0.000000000000000000000000000000	\N	2025-08-12 17:11:01.858	2025-08-15 07:12:10.866	\N	\N	0.00
cmed17tc000033oz9sh80yhgx	cmed17tby00013oz98cs4ym31	SMALL_BUSINESS	Super Companyy	\N	yoyo	education	high	f	PENDING	\N	\N	2	0.000000000000000000000000000000	\N	2025-08-15 16:17:47.325	2025-08-15 17:52:14.294	\N	\N	0.00
cmed0yrq70005ct6zynkn5icz	cmed0yrq30003ct6zvbt98vmj	SMALL_BUSINESS	Employer Super	\N	Super Employer	marketing	high	f	PENDING	\N	\N	3	0.000000000000000000000000000000	\N	2025-08-15 16:10:45.339	2025-08-15 20:23:20.927	\N	\N	0.00
cmedagfuo0003kkbdwo4o8sbi	cme612nk60009yx1kgqonmviw	INDIVIDUAL	\N	\N	\N	startup	medium	f	PENDING	\N	\N	2	0.000000000000000000000000000000	\N	2025-08-15 20:36:26.304	2025-08-16 18:32:59.066	\N	\N	0.00
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, "taskId", "employerId", "workerId", amount, status, "mandateId", "upiId", "workerUpiId", "transactionId", "escrowedAt", "completedAt", "refundedAt", "escrowMethod", "bankName", "paymentNote", "createdAt", "updatedAt") FROM stdin;
cmebrn5400003x71yeqz1hhs1	cme8u65aa0005saf1vks3ssg4	cme8ssq980003uovgmfs0acbu	cme60zodb0003yx1k1cdqqb5o	800.00	COMPLETED	cme8sudbx0009uovghzq3b4hx	employer@hdfc	9876543210@paytm	TXN439051NR5N1W	2025-08-14 19:02:00.095	2025-08-14 19:07:19.051	\N	UPI	HDFC Bank	Payment released to worker - Rating: 5/5	2025-08-14 19:02:00.097	2025-08-14 19:07:19.052
cmebrwkun000hx71ydg9l1qpl	cme8tjko80004itf5w58dnu2p	cme8ssq980003uovgmfs0acbu	cme60zodb0003yx1k1cdqqb5o	800.00	COMPLETED	cme8sudbx0009uovghzq3b4hx	employer@hdfc	9876543210@paytm	TXN70551788LG20	2025-08-14 19:09:20.398	2025-08-14 19:11:45.517	\N	UPI	HDFC Bank	Payment released to worker - Rating: 5/5	2025-08-14 19:09:20.399	2025-08-14 19:11:45.518
cmebsc3x2000f10t3szpqq2fr	cmebs9lw6000510t376dd894o	cme8ssq980003uovgmfs0acbu	cme60zodb0003yx1k1cdqqb5o	800.00	COMPLETED	cme8sudbx0009uovghzq3b4hx	employer@hdfc	9876543210@paytm	TXN399162D1EROX	2025-08-14 19:21:24.948	2025-08-14 19:23:19.162	\N	UPI	HDFC Bank	Payment released to worker - Rating: 5/5	2025-08-14 19:21:24.951	2025-08-14 19:23:19.163
cmechs26n000fx57ugeaok3ex	cmechq5pk0005x57u6vuvn90n	cme8ssq980003uovgmfs0acbu	cme60zodb0003yx1k1cdqqb5o	400.00	COMPLETED	cme8sudbx0009uovghzq3b4hx	employer@hdfc	9876543210@paytm	TXN031926D4RC0B	2025-08-15 07:13:39.598	2025-08-15 07:13:51.926	\N	UPI	HDFC Bank	Payment released to worker - Rating: 5/5	2025-08-15 07:13:39.6	2025-08-15 07:13:51.927
cmed2ljyz000fk8ycn3b8hiwd	cmed2jury0005k8ycwqgrwvtq	cmed17tc000033oz9sh80yhgx	cme60zodb0003yx1k1cdqqb5o	800.00	COMPLETED	cmed2j11i0003k8yc61s3zgef	employer@sbi	9876543210@paytm	TXN3902844OUJWZ	2025-08-15 16:56:27.995	2025-08-15 17:53:10.284	\N	UPI	State Bank of India	Payment released to worker - Rating: 5/5	2025-08-15 16:56:27.996	2025-08-15 17:53:10.284
cmed4ohxx000fzqc99j2o87c6	cmed4l9zg0003zqc98mfzwwcf	cmed17tc000033oz9sh80yhgx	cme60zodb0003yx1k1cdqqb5o	400.00	COMPLETED	cmed2j11i0003k8yc61s3zgef	employer@sbi	9876543210@paytm	TXN491253A85MBN	2025-08-15 17:54:44.565	2025-08-15 17:54:51.253	\N	UPI	State Bank of India	Payment released to worker - Rating: 1/5	2025-08-15 17:54:44.566	2025-08-15 17:54:51.254
cmed8oc7n000fgrnytlgvjqfh	cmed8ne0z0007grnyrxaol4n2	cmed0yrq70005ct6zynkn5icz	cme60zodb0003yx1k1cdqqb5o	2000.00	COMPLETED	cmed8m9s00005grnyqjuvnmu9	employer@hdfc	9876543210@paytm	TXN588800RQD5U5	2025-08-15 19:46:35.602	2025-08-15 19:53:08.8	\N	UPI	HDFC Bank	Payment released to worker - Rating: 1/5	2025-08-15 19:46:35.603	2025-08-15 19:53:08.8
cmed9whrn000113e2q4q2t2kn	cmed99wsa0005bgy0z6840t7f	cmed0yrq70005ct6zynkn5icz	cme60zodb0003yx1k1cdqqb5o	2000.00	COMPLETED	cmed8m9s00005grnyqjuvnmu9	employer@hdfc	9876543210@paytm	TXN260672SNRMAE	2025-08-15 20:20:55.667	2025-08-15 20:21:00.672	\N	UPI	HDFC Bank	Payment released to worker - Rating: 1/5	2025-08-15 20:20:55.667	2025-08-15 20:21:00.673
cmeeik6a1000vz43tzxgqsv5i	cmeeihflq000lz43thc8f4wf4	cmedagfuo0003kkbdwo4o8sbi	cme60zodb0003yx1k1cdqqb5o	800.00	COMPLETED	cmeehe9wq0007z43t9ssu7cjt	employer@sbi	9876543210@paytm	TXN1454516HH68L	2025-08-16 17:11:03.62	2025-08-16 17:59:05.451	\N	UPI	State Bank of India	Payment released after submission approval - Rating: 5/5	2025-08-16 17:11:03.625	2025-08-16 17:59:05.452
cmeelia9o000drs9yublu5y7e	cmeelhj1s0005rs9yfb14fzh0	cmedagfuo0003kkbdwo4o8sbi	\N	6400.00	ESCROWED	cmeehe9wq0007z43t9ssu7cjt	employer@sbi	\N	TXN214330Y3MO5X	2025-08-16 18:33:34.33	\N	\N	UPI	State Bank of India	Task payment escrowed automatically on task acceptance	2025-08-16 18:33:34.332	2025-08-16 18:33:34.332
\.


--
-- Data for Name: quiz_results; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quiz_results (id, "workerId", answers, "totalScore", "maxScore", "timeTaken", "evaluatedBy", "aiConfidence", "aiSource", "createdAt") FROM stdin;
\.


--
-- Data for Name: ratings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ratings (id, "taskId", "applicationId", "raterType", "workerId", "employerId", "ratedWorkerId", "ratedEmployerId", stars, "ratedAt", "isVisible") FROM stdin;
\.


--
-- Data for Name: resumes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resumes (id, "workerId", "originalName", "fileName", "filePath", "fileSize", "mimeType", "textContent", metadata, "basicInfo", "uploadedAt") FROM stdin;
cme340fi300051t4smkwaeq6c	cme340fhv00031t4s3yafg523	HarshilNewResume (1).pdf	1754674695984_6d994894_HarshilNewResume__1_.pdf	/Users/harshilpatel/Documents/nanojobs/backend/uploads/resumes/1754674695984_6d994894_HarshilNewResume__1_.pdf	81183	application/pdf	HARSHIL PATEL 91 6354862755harshilgami26 gmail.comLinkedIn: Harshil PatelGitHub: harshilpatel22 OBJECTIVE Bachelors Of Information Technology Student looking for summer internships. EDUCATION Bachelor of Information Technology, CGPA - 8.7, Vellore Institute Of Technology2026 SKILLS Technical SkillsJava, C, C , HTML, Node.JS, AngularJS, React, Python, CSS, 8051 Assembly Language, AI, ML, Flask, Express.JS SDKAndroid Studio, Flutter, Unity Engine, Arduino IDE, Cisco Packet Tracer Designing SkillsFigma, Star UML, Canva, Microsoft Office Database Management SkillsSQL Plus, MongoDB, Firebase, MS Excel EXPERIENCE App Developer InternshipAug 2023 - Dec 2023 FlixdinVellore, Tamil Nadu Helped develop various software architectures. Gained hands-on experience in designing and implementing user-friendly interfaces Actively contributed to code reviews, provided feedback, and made necessary improvements Integrated various API s and SQL to create a fully functional user friendly mobile application. PROJECTS Fall Detection IoT System.Developed an IoT-based fall detection system utilizing a NodeMCU microcontroller and an accelerometer sensor to monitor sudden movements and detect potential falls. Integrated real-time notifications with the Blynk app to alert users of detected falls, ensuring timely response. Integrated GPS functionality to capture and transmit the precise location of the fall, enhancing situational awareness for emergency responders. Emphasized system reliability and accuracy through algorithm tuning to minimize false positives and false negatives. Task Management Website.Developed a full-featured task management application using the MERN stack (MongoDB, Express.js, React.js, Node.js). Implemented user authentication, task CRUD operations, and real-time updates using Web Sockets. Designed a responsive and intuitive user interface with Material-eUI and CSS Grid. Integrated RESTful APIs for seamless data interaction between frontend and backend. Plant Recognition AI model.Developed a deep learning-based plant recognition model capable of identifying 1,058 distinct plant species with high accuracy. Leveraged a substantial dataset of 150,000 images, implementing ad- vanced image pre-processing and augmentation techniques to optimize model performance. Employed convolutional neural networks (CNNs) for feature extraction, with rigorous training and validation to achieve precise species clas- sification. This model showcases expertise in the handling of large-scale datasets, modeling training, and fine-tuning for real-world biodiversity applications, contributing to efficient plant identification and supporting botanical research and conservation efforts. Energy Consumption Prediction using LSTM Neural Networks.Designed and implemented a time series prediction model to forecast electricity consumption in Finland using an LSTM-based deep learning approach. Con- ducted extensive data preprocessing, including feature extraction, normalization, and resampling, to optimize model performance. Engineered insightful visualizations of historical energy consumption trends using Python libraries (Matplotlib, Seaborn) for exploratory data analysis. Built and trained an LSTM model with multiple layers and dropout regularization to reduce overfitting, achieving accurate consumption predictions for training, validation, and test datasets. The performance of the model was evaluated using RMSE and other metrics, the results were visu- alized, and the model was extended for future consumption forecasting. Demonstrated expertise in handling large datasets, neural network design, and predictive analytics for real-world applications. ACHIEVEMENTS Developed a business model to facilitate the movement of raw inputs to a production center to make biodegrad- able sanitary napkins from agro-waste. Secured the 2nd position at E-Summit 24, the flagship event by E-Cell, VIT from a cohort of 120 teams. Secured the 2nd Position at ManuPitch 360, a business model development competition, held during graVITas, the international flagship technical fest at VIT, Vellore, from amongst 75 teams. Top 20 AIR Holder in multiple International Olympiads, including NASO AIR1. (from 2015-2020) LEADERSHIP Overlooked the management of several Technical Hackathons conducted by the IEEE-TEMS-VIT student chap- ter. Led teams through prelims and elimination rounds in competitions including thr Smart India Hackathon, E- Summit VIT 2024, and BOLT 2.0.	{"info": {"Title": "", "Author": "", "Creator": "LaTeX with hyperref", "ModDate": "D:20250123183253Z", "Subject": "", "Trapped": {"name": "False"}, "Keywords": "", "Producer": "pdfTeX-1.40.26", "CreationDate": "D:20250123183253Z", "IsXFAPresent": false, "PDFFormatVersion": "1.5", "IsAcroFormPresent": false}, "pages": 2, "format": "pdf", "fileSize": 81183, "parsedAt": "2025-08-08T17:38:16.097Z", "wordCount": 583, "originalName": "HarshilNewResume (1).pdf", "fileExtension": ".pdf", "characterCount": 4477}	{"name": null, "email": null, "phone": "916354862755", "skills": ["python", "java", "react", "node", "angular", "html", "css", "mongodb", "git", "figma", "excel", "data analysis"], "education": "Bachelor", "experience": null}	2025-08-08 17:38:19.878
cme618e2d000lyx1k8rnuj6vp	cme618e24000jyx1kq8wuhhzy	harshilResume.pdf	1754851427397_486340f0_harshilResume.pdf	/Users/harshilpatel/Documents/nanojobs/backend/uploads/resumes/1754851427397_486340f0_harshilResume.pdf	93834	application/pdf	HARSHIL PATEL 91 6354862755harshilgami26 gmail.comLinkedIn: Harshil PatelGitHub: harshilpatel22 EDUCATION Bachelor of Information Technology, Vellore Institute Of Technology2022-2026 CGPA: 8.7 10.0 SKILLS ProgrammingJava, C, C , Python, HTML, CSS, Node.js, AngularJS, React, Flask, Express.js, 8051 Assembly Tools PlatformsAndroid Studio, Flutter, Unity Engine, Arduino IDE, Cisco Packet Tracer DesignFigma, Star UML, Canva, Microsoft Office DatabaseSQL Plus, MongoDB, Firebase, MS Excel AreasAI ML EXPERIENCE Cambridge Judge Business SchoolOngoing Research Intern - RemoteCambridge, United Kingdom Conducting research on mentor-mentee matching for the CJBS Accelerate Program to enhance micro-entrepreneurial growth Developing a two-sided matching framework based on personal and professional characteristics Utilizing econometric modeling and machine learning for data analysis (Research funded by Tony Cowling Foundation Award, 10,000) FlixdinAug 2023 - Dec 2023 App Developer InternVellore, Tamil Nadu Helped develop software architectures and implemented user-friendly interfaces Contributed to code reviews, provided feedback, and made necessary improvements Integrated various APIs and SQL to create a fully functional user-friendly mobile application PROJECTS Fall Detection IoT System:Developed an IoT-based system using NodeMCU microcontroller and accelerometer to detect falls, integrated with Blynk app for real-time notifications and GPS functionality Task Management Website:Built a full-featured MERN stack application with user authentication, CRUD operations, and WebSocket-enabled real-time updates with Material-UI interface Plant Recognition AI Model:Developed a CNN-based deep learning model identifying 1,058 plant species using 150,000 images with advanced pre-processing and augmentation techniques Energy Consumption Prediction:Created an LSTM-based time series model to forecast electricity consumption in Finland with comprehensive data preprocessing for optimized performance ACHIEVEMENTS LEADERSHIP Secured2nd positionat E-Summit 24 (VIT) from 120 teams for biodegradable sanitary napkins business model Secured2nd positionat ManuPitch 360 during graVITas international technical fest from 75 teams Top 20 AIR Holderin multiple International Olympiads, including NASO AIR1 (2015-2020) Managed technical hackathons conducted by the IEEE-TEMS-VIT student chapter Led teams in competitions including Smart India Hackathon, E-Summit VIT 2024, and BOLT 2.0	{"info": {"Title": "", "Author": "", "Creator": "LaTeX with hyperref", "ModDate": "D:20250330091307Z", "Subject": "", "Trapped": {"name": "False"}, "Keywords": "", "Producer": "pdfTeX-1.40.26", "CreationDate": "D:20250330091307Z", "IsXFAPresent": false, "PDFFormatVersion": "1.5", "IsAcroFormPresent": false}, "pages": 1, "format": "pdf", "fileSize": 93834, "parsedAt": "2025-08-10T18:43:47.509Z", "wordCount": 305, "originalName": "harshilResume.pdf", "fileExtension": ".pdf", "characterCount": 2480}	{"name": null, "email": null, "phone": "916354862755", "skills": ["python", "java", "react", "node", "angular", "html", "css", "mongodb", "git", "figma", "excel", "data analysis"], "education": "Bachelor", "experience": null}	2025-08-10 18:43:50.949
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, "userId", token, "isActive", "expiresAt", "createdAt", "lastUsed", metadata) FROM stdin;
cme618e2u000pyx1kq9a9wwk9	cme618e1z000hyx1k9pq3w3mm	25c7344f-e82c-4cfb-82ff-3bb17db2fc5d	t	2025-08-17 18:43:50.981	2025-08-10 18:43:50.949	2025-08-10 18:50:46.241	\N
cme340fig00091t4slhcv8ucb	cme340fhk00011t4shpymtom2	f56d382d-c500-4fc9-b67f-0f58eddb1872	t	2025-08-15 17:38:19.911	2025-08-08 17:38:19.878	2025-08-14 19:07:53.593	\N
cme61j7wq000113s0kn4osw7u	cme340fhk00011t4shpymtom2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWUzNDBmaHYwMDAzMXQ0czN5YWZnNTIzIiwicGhvbmUiOiI2MzU0ODYyNzU1IiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiI3YzZmYWEzNi0wMGZmLTQ2ZjktYWNjMC1kMmUzZTUxMmJlNWEiLCJpYXQiOjE3NTQ4NTE5NDUsImV4cCI6MTc1NzQ0Mzk0NSwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.qqfFfIL4GmcwPNO6sbgwDcfaIW9J4FGJIqpWD_7rOV8	t	2025-09-09 18:52:25.428	2025-08-10 18:52:16.202	2025-08-14 19:07:53.593	{"ip": "::1", "otp": "182246", "phone": "6354862755", "attempts": 0, "otpSentAt": "2025-08-10T18:52:16.201Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-10T18:52:25.428Z", "loginSuccessful": true}
cme61lfof000713s0u41y6mvb	cme61lfo2000313s0g75xz7jl	e6574045-5500-4481-93e2-6559776ea461	t	2025-08-17 18:53:59.582	2025-08-10 18:53:59.567	2025-08-10 18:53:59.64	\N
cme61n5vh000d13s0kdxziuy9	cme61n5v4000913s0y9a0shpd	148f0c0e-51e2-4f6a-9eaa-91f7f5458c55	t	2025-08-17 18:55:20.184	2025-08-10 18:55:20.175	2025-08-10 18:55:20.232	\N
cmed0yrqa0007ct6zr28cw8fe	cmed0yrq30003ct6zvbt98vmj	774ffa58-5911-4f92-b180-894f5442e9dc	t	2025-08-22 16:10:45.345	2025-08-15 16:10:45.339	2025-08-15 20:23:01.816	\N
cmeepcvm2000112wr88d6p8rc	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNzU2ODAsImV4cCI6MTc1NTk4MDQ4MH0.Z2vSaS82EH5MUdevhMLQaFkHEXzrUQboNa3lYGT1UA8	t	2025-08-23 20:21:20.522	2025-08-16 20:21:20.523	2025-08-16 20:21:44.618	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmeejs9gh0009jzggha5v6jwg	cme612nk60009yx1kgqonmviw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MTJuazYwMDA5eXgxa2dxb25tdml3IiwicGhvbmUiOiI5ODc2NTQzMjExIiwidXNlclR5cGUiOiJlbXBsb3llciIsImlhdCI6MTc1NTM2NjMyMCwiZXhwIjoxNzU1OTcxMTIwfQ.xxzEDNLsFl1-VaVgUDa74ZLwFvgQGJL_ov99KT-2Ekk	t	2025-08-23 17:45:20.608	2025-08-16 17:45:20.609	2025-08-16 20:21:49.286	{"loginType": "dev-employer", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmed4pmll000jzqc96vkw4ijr	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiJiOGRiYTkwZi0zMGJhLTQ0YWUtYTM1ZC0wYWIyMmM2Y2E0NTkiLCJpYXQiOjE3NTUyODA1NDIsImV4cCI6MTc1Nzg3MjU0MiwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.5uXvKNpsUDTQeaRTndw5RH-P7r1NaGWSfSbEn3423l8	t	2025-09-14 17:55:42.173	2025-08-15 17:55:37.257	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "610994", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-15T17:55:37.256Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T17:55:42.173Z", "loginSuccessful": true}
cmeehdq9p0005z43txx6qh1kr	cme612nk60009yx1kgqonmviw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MTJuazYwMDA5eXgxa2dxb25tdml3IiwicGhvbmUiOiI5ODc2NTQzMjExIiwidXNlclR5cGUiOiJlbXBsb3llciIsImlhdCI6MTc1NTM2MjI4MywiZXhwIjoxNzU1OTY3MDgzfQ.aTjFHaB4Pkz23IfW1gNlUKB2shzmpSi0FEf8Xi9Xc6Y	t	2025-08-23 16:38:03.323	2025-08-16 16:38:03.325	2025-08-16 20:21:49.286	{"loginType": "dev-employer", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmebrf35f0001flgmrv5fdb4u	cme8ssq950001uovg7maxef8w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU4c3NxOTgwMDAzdW92Z21mczBhY2J1IiwicGhvbmUiOiI5NjQzODkwMTEyIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6ImYzNDFlNTMyLTkwZjktNGE2OS1iMjQxLThmYjZhYTRiMWFhMCIsImlhdCI6MTc1NTE5Nzc1OSwiZXhwIjoxNzU3Nzg5NzU5LCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.ozhuOtlB-I5kwUFmUb7xdvND3-iwNBXessrUxTf2kac	t	2025-09-13 18:55:59.88	2025-08-14 18:55:44.307	2025-08-15 07:13:34.131	{"ip": "::1", "otp": "339999", "phone": "9643890112", "attempts": 0, "otpSentAt": "2025-08-14T18:55:44.307Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T18:55:59.880Z", "loginSuccessful": true}
cmebrsjg90007x71ylzoqbhzj	cme8ssq950001uovg7maxef8w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU4c3NxOTgwMDAzdW92Z21mczBhY2J1IiwicGhvbmUiOiI5NjQzODkwMTEyIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6ImNiM2E1MGM2LTJhOTItNDY2YS05ZGJjLTczYzcwNmI0NmE4YyIsImlhdCI6MTc1NTE5ODM3NywiZXhwIjoxNzU3NzkwMzc3LCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.E21N1EcCbxKM9cAI1WXv4MmELAphFKd5UWdIqRGSb3k	t	2025-09-13 19:06:17.451	2025-08-14 19:06:11.962	2025-08-15 07:13:34.131	{"ip": "::1", "otp": "608466", "phone": "9643890112", "attempts": 0, "otpSentAt": "2025-08-14T19:06:11.960Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T19:06:17.451Z", "loginSuccessful": true}
cme8sg0kx0007dqq8ectvlgod	cme8sg0kj0003dqq8u1hvr03b	dc4baeb6-73ba-4219-a3be-b5a2b8bc1ccf	t	2025-08-19 17:01:08.721	2025-08-12 17:01:08.702	2025-08-12 17:01:08.761	\N
cme8sdfi40001dqq8fzdmmoug	cme340fhk00011t4shpymtom2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWUzNDBmaHYwMDAzMXQ0czN5YWZnNTIzIiwicGhvbmUiOiI2MzU0ODYyNzU1IiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiIwZGE2MTZiZi1kYzkwLTQwMmQtODhhOS1jODQwM2FlMmZmNWEiLCJpYXQiOjE3NTUwMTc5NTgsImV4cCI6MTc1NzYwOTk1OCwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.zuwo1kyAlwZ8m5dPhi2AhRs_btqvJEkXJ0bdQsLPaq4	t	2025-09-11 16:59:18.252	2025-08-12 16:59:08.092	2025-08-14 19:07:53.593	{"ip": "::1", "otp": "786074", "phone": "6354862755", "attempts": 0, "otpSentAt": "2025-08-12T16:59:08.092Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-12T16:59:18.252Z", "loginSuccessful": true}
cmed17tc400053oz9l8fzhnn5	cmed17tby00013oz98cs4ym31	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWVkMTd0YnkwMDAxM296OThjczR5bTMxIiwicGhvbmUiOiI5OTk5OTExMTExIiwidXNlclR5cGUiOiJlbXBsb3llciIsImVtcGxveWVySWQiOiJjbWVkMTd0YzAwMDAzM296OXNoODB5aGd4Iiwic2Vzc2lvbklkIjoiODBjMTZkZTAtZTdkMi00NDhjLThjYjMtMDU2MzNkOTExYzMwIiwiaWF0IjoxNzU1Mjc0NjY3LCJleHAiOjE3NTc4NjY2NjcsImF1ZCI6Im5hbm9qb2JzLXVzZXJzIiwiaXNzIjoibmFub2pvYnMifQ.o7li6MJFSzI6gypfK-FdA1lNyJR_RRRcg56LAqWgNYI	t	2025-09-14 16:17:47.332	2025-08-15 16:17:47.325	2025-08-15 17:54:33.759	{"userAgent": "employer-registration", "employerType": "small_business", "registeredAt": "2025-08-15T16:17:47.332Z"}
cmeelfx0g0001rs9yt0z8t5hs	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNjkxMDMsImV4cCI6MTc1NTk3MzkwM30.Pcttk_5PVTKt9M4aVJ0FsNEFv27Bs0DNnaHfUvwkRr8	t	2025-08-23 18:31:43.839	2025-08-16 18:31:43.84	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmeelkrdz00038iw5yq0335ck	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNjkzMjksImV4cCI6MTc1NTk3NDEyOX0.HYdaXlGO4HjhWR2UjjbNTgjidKItBcRAhW_-MD0owJM	t	2025-08-23 18:35:29.831	2025-08-16 18:35:29.832	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmeeh9ilb0001z43tg7s8ihv4	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNjIwODYsImV4cCI6MTc1NTk2Njg4Nn0.771DX1lS7pAKe7TBkOX_70xxMsNfsy47XD9_clIENmI	t	2025-08-23 16:34:46.751	2025-08-16 16:34:46.751	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cme8t2w330001ez0l1ryo3g1l	cme8ssq950001uovg7maxef8w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU4c3NxOTgwMDAzdW92Z21mczBhY2J1IiwicGhvbmUiOiI5NjQzODkwMTEyIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6IjdhYWQzZmNjLWMzNGItNDg4MC05NjdkLTRkMTQ2MGFjYjVjNiIsImlhdCI6MTc1NTAxOTE0MywiZXhwIjoxNzU3NjExMTQzLCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.f9sMQ811oYZjYjd5zCtdWsbJqvmHkbwYWuiz1zS85eI	t	2025-09-11 17:19:03.541	2025-08-12 17:18:55.984	2025-08-15 07:13:34.131	{"ip": "::1", "otp": "627435", "phone": "9643890112", "attempts": 0, "otpSentAt": "2025-08-12T17:18:55.983Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-12T17:19:03.541Z", "loginSuccessful": true}
cmebrz6w4000jx71ybanoy7nc	cme8ssq950001uovg7maxef8w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU4c3NxOTgwMDAzdW92Z21mczBhY2J1IiwicGhvbmUiOiI5NjQzODkwMTEyIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6IjkyNzg3NTFlLWE5ZGItNDg1Zi04MzAwLWYwMTFmZTg1NmEzYyIsImlhdCI6MTc1NTE5ODY4OCwiZXhwIjoxNzU3NzkwNjg4LCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.jp1JwJhY9NfSYSWLqc3w17fIC7KobD3HeEhjkV2DzXE	t	2025-09-13 19:11:28.564	2025-08-14 19:11:22.276	2025-08-15 07:13:34.131	{"ip": "::1", "otp": "266532", "phone": "9643890112", "attempts": 0, "otpSentAt": "2025-08-14T19:11:22.275Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T19:11:28.564Z", "loginSuccessful": true}
cme8ssq9e0005uovgrtm9c47h	cme8ssq950001uovg7maxef8w	29c63e4f-b1af-43ca-89fe-fd866ce5b4ee	t	2025-08-19 17:11:01.873	2025-08-12 17:11:01.858	2025-08-15 07:13:34.131	\N
cmeei79d7000fz43tr0qpkxjz	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNjM2NjEsImV4cCI6MTc1NTk2ODQ2MX0.IUAgQBAxkvr2OvI1r68riDNDKC0TkuSlj_oL9LHxm0Y	t	2025-08-23 17:01:01.098	2025-08-16 17:01:01.099	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmedb2a2200016jfc6goggtj9	cme612nk60009yx1kgqonmviw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MTJuazYwMDA5eXgxa2dxb25tdml3IiwicGhvbmUiOiI5ODc2NTQzMjExIiwidXNlclR5cGUiOiJlbXBsb3llciIsImlhdCI6MTc1NTI5MTIwNSwiZXhwIjoxNzU1ODk2MDA1fQ.q0SbgKNa30f1VI0_nGMKADezGAJDtyp3sQT2-Bbt4-Q	t	2025-08-22 20:53:25.225	2025-08-15 20:53:25.226	2025-08-16 20:21:49.286	{"loginType": "dev-employer", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cme612nkd000fyx1k1ykfjyy8	cme612nk60009yx1kgqonmviw	87afdb05-57b3-4346-b4f7-637f2af3e418	t	2025-08-17 18:39:23.341	2025-08-10 18:39:23.334	2025-08-16 20:21:49.286	\N
cmed8w4bt0001cca1s4s8hn1z	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiJiZjNlYzY0MS04YzMxLTRlOTctYmY1OC1hY2U3Y2Y1OTE4NDMiLCJpYXQiOjE3NTUyODc1NjQsImV4cCI6MTc1Nzg3OTU2NCwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.ePEaEEmDlJl-9GbKROL3gpSXzHR7WjukGDpxchbG8I4	t	2025-09-14 19:52:44.953	2025-08-15 19:52:38.633	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "810063", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-15T19:52:38.632Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T19:52:44.953Z", "loginSuccessful": true}
cmed9p07w0001i0mx7r0x3hyu	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiI3YmNkZmJlOS1jMjM2LTQ0ZDMtOTNiZi04YmMzZGIwZTljZWQiLCJpYXQiOjE3NTUyODg5MTMsImV4cCI6MTc1Nzg4MDkxMywiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.x6KoVL6jbzaw2hzusAj4OA8YLen-TAjvqaeUiaGTorM	t	2025-09-14 20:15:13.375	2025-08-15 20:15:06.332	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "487664", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-15T20:15:06.332Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T20:15:13.375Z", "loginSuccessful": true}
cmebrmdf40001x71ygupdytku	cme8ssq950001uovg7maxef8w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU4c3NxOTgwMDAzdW92Z21mczBhY2J1IiwicGhvbmUiOiI5NjQzODkwMTEyIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6IjRkN2RiMjcwLTkxYWEtNDFiMC1iMDg3LTYyY2YzMDllODdjNSIsImlhdCI6MTc1NTE5ODA5MCwiZXhwIjoxNzU3NzkwMDkwLCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.M6jfsnor_z1P_kM8bvEu0Tt-1ROEFkuOboKA2HEkenU	t	2025-09-13 19:01:30.751	2025-08-14 19:01:24.208	2025-08-15 07:13:34.131	{"ip": "::1", "otp": "735535", "phone": "9643890112", "attempts": 0, "otpSentAt": "2025-08-14T19:01:24.207Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T19:01:30.751Z", "loginSuccessful": true}
cmed8nucm000bgrnyr8luqypu	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiI5NWIwNjEzNS02ZjY0LTRlYjUtYjM0Mi1iMzNmMzlmZjA5YjMiLCJpYXQiOjE3NTUyODcxNzksImV4cCI6MTc1Nzg3OTE3OSwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.qs0v_5st94j1cjLW03s2qwek1qWlDTLR3tcdXHtsDo0	t	2025-09-14 19:46:19.783	2025-08-15 19:46:12.454	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "768921", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-15T19:46:12.453Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T19:46:19.783Z", "loginSuccessful": true}
cmeeihnww000pz43tixmnpjfg	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNjQxNDYsImV4cCI6MTc1NTk2ODk0Nn0.KEJP9YRxU_m34i6-OUn8m-HWmHqKGQk1qbn0f-DuaMs	t	2025-08-23 17:09:06.512	2025-08-16 17:09:06.513	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmeek58zk0003il0i7gyv6iq5	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNjY5MjYsImV4cCI6MTc1NTk3MTcyNn0.g91yX12BSvjIh79yKtIJhmwKhIPt7xpziGkuRXOiFQg	t	2025-08-23 17:55:26.528	2025-08-16 17:55:26.528	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmedb4dat00056jfcxtyxgojj	cme612nk60009yx1kgqonmviw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MTJuazYwMDA5eXgxa2dxb25tdml3IiwicGhvbmUiOiI5ODc2NTQzMjExIiwidXNlclR5cGUiOiJlbXBsb3llciIsImlhdCI6MTc1NTI5MTMwMiwiZXhwIjoxNzU1ODk2MTAyfQ.nRM27gall489z7Y7sVlkj-owOPgvy6IlPYCe2OCLPoc	t	2025-08-22 20:55:02.74	2025-08-15 20:55:02.741	2025-08-16 20:21:49.286	{"loginType": "dev-employer", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmed8wfei0003cca1h3qiin17	cmed0yrq30003ct6zvbt98vmj	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWVkMHlycTcwMDA1Y3Q2enlua241aWN6IiwicGhvbmUiOiI5OTk5OTAwMDAwIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6IjdkNGJhNTM1LTc2NzAtNDI4Yi1iZTcwLTc4NmYwMzc0ZTllMiIsImlhdCI6MTc1NTI4NzU3NywiZXhwIjoxNzU3ODc5NTc3LCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.uZM0bu-aEcSjyRsOiuJXBPD6I5zZJPF4RtAXt2eDSVs	t	2025-09-14 19:52:57.637	2025-08-15 19:52:52.986	2025-08-15 20:23:01.816	{"ip": "::1", "otp": "152691", "phone": "9999900000", "attempts": 0, "otpSentAt": "2025-08-15T19:52:52.984Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T19:52:57.637Z", "loginSuccessful": true}
cmedajl1o000bkkbd5k5xqkbg	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUyOTAzMzMsImV4cCI6MTc1NTg5NTEzM30.aRNB_BajZUHtVGfaAN-w-0F4XSPmfuDaANHdeFtBtzs	t	2025-08-22 20:38:53.001	2025-08-15 20:38:53.003	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmed47t4300032h942zp0jfpi	cmed17tby00013oz98cs4ym31	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWVkMTd0YzAwMDAzM296OXNoODB5aGd4IiwicGhvbmUiOiI5OTk5OTExMTExIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6IjBmOWUzMzdhLThjMDItNDFiOS1hOWU1LTFkOGMwZDRjMTE0ZCIsImlhdCI6MTc1NTI3OTcxMSwiZXhwIjoxNzU3ODcxNzExLCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.vbIStfcdeleznapcW9RgwGZwTeCDKvQJykOAJbec1BQ	t	2025-09-14 17:41:51.767	2025-08-15 17:41:45.891	2025-08-15 17:54:33.759	{"ip": "::1", "otp": "584175", "phone": "9999911111", "attempts": 0, "otpSentAt": "2025-08-15T17:41:45.890Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T17:41:51.767Z", "loginSuccessful": true}
cmeeik2as000tz43tt9yniwio	cme612nk60009yx1kgqonmviw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MTJuazYwMDA5eXgxa2dxb25tdml3IiwicGhvbmUiOiI5ODc2NTQzMjExIiwidXNlclR5cGUiOiJlbXBsb3llciIsImlhdCI6MTc1NTM2NDI1OCwiZXhwIjoxNzU1OTY5MDU4fQ.ix8XxT42Oi0Mg3qfIEzRbjxekaZPUdUqItKxOF6LyzI	t	2025-08-23 17:10:58.467	2025-08-16 17:10:58.468	2025-08-16 20:21:49.286	{"loginType": "dev-employer", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmed1m3v500093oz9200kup6m	cmed17tby00013oz98cs4ym31	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWVkMTd0YzAwMDAzM296OXNoODB5aGd4IiwicGhvbmUiOiI5OTk5OTExMTExIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6IjA2ODg0NWM4LWNmZDMtNGQ0OC1hMjRiLWI1MWNlMTJhMTUxMyIsImlhdCI6MTc1NTI3NTM0MSwiZXhwIjoxNzU3ODY3MzQxLCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.JZaOByIe_X1-_NODs4ofPUq1j2JUFSKDqbud2470VCU	t	2025-09-14 16:29:01.913	2025-08-15 16:28:54.161	2025-08-15 17:54:33.759	{"ip": "::1", "otp": "211988", "phone": "9999911111", "attempts": 0, "otpSentAt": "2025-08-15T16:28:54.160Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T16:29:01.913Z", "loginSuccessful": true}
cmechrtdx000dx57uefjxmm2a	cme8ssq950001uovg7maxef8w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU4c3NxOTgwMDAzdW92Z21mczBhY2J1IiwicGhvbmUiOiI5NjQzODkwMTEyIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6ImI4ZDgwMTgxLThiMmQtNDUwYy05MjEyLWE2Yzg3ZmVhZGIwMCIsImlhdCI6MTc1NTI0MjAxMywiZXhwIjoxNzU3ODM0MDEzLCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.aJBkdD7Ldl65KJg7WAL4432OB67HHfBwjKvbpUzJkyU	t	2025-09-14 07:13:33.071	2025-08-15 07:13:28.197	2025-08-15 07:13:51.967	{"ip": "::1", "otp": "874091", "phone": "9643890112", "attempts": 0, "otpSentAt": "2025-08-15T07:13:28.196Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T07:13:33.071Z", "loginSuccessful": true}
cme8ucbn80003q9rbyhu0lyfe	cme340fhk00011t4shpymtom2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWUzNDBmaHYwMDAzMXQ0czN5YWZnNTIzIiwicGhvbmUiOiI2MzU0ODYyNzU1IiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiI5ODIxODVkMy0yM2FjLTRjYWUtYWUwYS1kY2U0NzJkYzgxNDQiLCJpYXQiOjE3NTUwMjEyNjEsImV4cCI6MTc1NzYxMzI2MSwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.QGZu9tbZdQzfrOTGDcygxh5mnSXquNx1oxMEkcoYUXo	t	2025-09-11 17:54:21.247	2025-08-12 17:54:15.669	2025-08-14 19:07:53.593	{"ip": "::1", "otp": "883047", "phone": "6354862755", "attempts": 0, "otpSentAt": "2025-08-12T17:54:15.668Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-12T17:54:21.247Z", "loginSuccessful": true}
cmed9qdbn0005i0mximn34uwj	cmed0yrq30003ct6zvbt98vmj	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWVkMHlycTcwMDA1Y3Q2enlua241aWN6IiwicGhvbmUiOiI5OTk5OTAwMDAwIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6IjZhODRmMjAwLTViNWQtNDAwMS05MWUxLTJjN2EyN2NiODFlNCIsImlhdCI6MTc1NTI4ODk3NSwiZXhwIjoxNzU3ODgwOTc1LCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.0EWGka8ga_hB-3GB54B6FDcFoIIO-N1n6S3sHTinjmw	t	2025-09-14 20:16:15.089	2025-08-15 20:16:09.971	2025-08-15 20:23:01.816	{"ip": "::1", "otp": "751717", "phone": "9999900000", "attempts": 0, "otpSentAt": "2025-08-15T20:16:09.970Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T20:16:15.089Z", "loginSuccessful": true}
cmed9z2eb000310bym0owber3	cmed0yrq30003ct6zvbt98vmj	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWVkMHlycTcwMDA1Y3Q2enlua241aWN6IiwicGhvbmUiOiI5OTk5OTAwMDAwIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6ImJlNjQ0YmFkLWRkZWMtNDQ5MC1hMDllLTJhOGYxNDgwODg1NCIsImlhdCI6MTc1NTI4OTM4MCwiZXhwIjoxNzU3ODgxMzgwLCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.m8nu2R1ck0XiqASOhT_gBNF1YfnNHRuEtOjfUShhDjA	t	2025-09-14 20:23:00.747	2025-08-15 20:22:55.715	2025-08-15 20:23:41.996	{"ip": "::1", "otp": "406026", "phone": "9999900000", "attempts": 0, "otpSentAt": "2025-08-15T20:22:55.714Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T20:23:00.747Z", "loginSuccessful": true}
cmechqlg70009x57u59xpfybm	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiIxYmI0ZjhhNS00ZDU1LTQwYTItYTQ2My02ZGFiNjRkMDQzNDMiLCJpYXQiOjE3NTUyNDE5NjAsImV4cCI6MTc1NzgzMzk2MCwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.361LfxpV_TyIs3v4CBoK9jFWIvaVxTAZRwZkGLD-huI	t	2025-09-14 07:12:40.418	2025-08-15 07:12:31.255	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "866530", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-15T07:12:31.253Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T07:12:40.418Z", "loginSuccessful": true}
cme8ub8xm0001q9rbc2mqg1ke	cme8ssq950001uovg7maxef8w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU4c3NxOTgwMDAzdW92Z21mczBhY2J1IiwicGhvbmUiOiI5NjQzODkwMTEyIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6IjMxNGQ1MjBkLTNlMDYtNDMyNy05MDkyLTMwNGQ0YTM2Yzg5MCIsImlhdCI6MTc1NTAyMTIyMCwiZXhwIjoxNzU3NjEzMjIwLCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.TABDi5KE_bmpgYMyiW8Md2v9WUjq9Ft_OVMa1XhjjmI	t	2025-09-11 17:53:40.657	2025-08-12 17:53:25.499	2025-08-15 07:13:34.131	{"ip": "::1", "otp": "855938", "phone": "9643890112", "attempts": 0, "otpSentAt": "2025-08-12T17:53:25.498Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-12T17:53:40.657Z", "loginSuccessful": true}
cmebrnvmz0005x71yj3kwdt5d	cme8ssq950001uovg7maxef8w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU4c3NxOTgwMDAzdW92Z21mczBhY2J1IiwicGhvbmUiOiI5NjQzODkwMTEyIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6ImM5NjYwOGRkLWRkZmEtNDdmMC04N2EyLWZkZmE1YTdmMzQ5MiIsImlhdCI6MTc1NTE5ODE2NSwiZXhwIjoxNzU3NzkwMTY1LCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.KqGWwGpeLz9ShMX4CXo2jwq_AYFhrnwGaMHHV420tqY	t	2025-09-13 19:02:45.8	2025-08-14 19:02:34.475	2025-08-15 07:13:34.131	{"ip": "::1", "otp": "443162", "phone": "9643890112", "attempts": 0, "otpSentAt": "2025-08-14T19:02:34.473Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T19:02:45.800Z", "loginSuccessful": true}
cmebqjjwi0001i20s8ydtxfkn	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiJkMGYxN2U4Yy0xODA1LTQxZjMtYTE2Mi1hZTU5MjFhMzhlMDQiLCJpYXQiOjE3NTUxOTYyODAsImV4cCI6MTc1Nzc4ODI4MCwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.j0ehNkcIJZ6fBTCXrhBOfGzWCXUttayRd_nqJevj8cg	t	2025-09-13 18:31:20.948	2025-08-14 18:31:13.027	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "393975", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-14T18:31:13.026Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T18:31:20.948Z", "loginSuccessful": true}
cmed3krbn0005h95gaonhgc47	cmed17tby00013oz98cs4ym31	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWVkMTd0YzAwMDAzM296OXNoODB5aGd4IiwicGhvbmUiOiI5OTk5OTExMTExIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6IjljYTVlZmNhLWFkYTAtNDI4Mi05NjZlLTA4ZDYyYzc3MjM4NiIsImlhdCI6MTc1NTI3ODY0MiwiZXhwIjoxNzU3ODcwNjQyLCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.fxsZk7b72xJXbzy4I43UxmS6FwHOxBR-jBcFlPpZKjc	t	2025-09-14 17:24:02.731	2025-08-15 17:23:50.483	2025-08-15 17:54:33.759	{"ip": "::1", "otp": "860399", "phone": "9999911111", "attempts": 0, "otpSentAt": "2025-08-15T17:23:50.482Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T17:24:02.731Z", "loginSuccessful": true}
cmed2inq20001k8yc04lw1atf	cmed17tby00013oz98cs4ym31	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWVkMTd0YzAwMDAzM296OXNoODB5aGd4IiwicGhvbmUiOiI5OTk5OTExMTExIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6ImMxNTQzZGE0LWI4OWMtNDM3Zi1iNTI4LTU3NTU4OGRjYzI0ZCIsImlhdCI6MTc1NTI3Njg2MSwiZXhwIjoxNzU3ODY4ODYxLCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.HQAHWaZZCTaWgXhRoZSr0DRzn9d_-Y27AhNWDzGfXqs	t	2025-09-14 16:54:21.678	2025-08-15 16:54:12.891	2025-08-15 17:54:33.759	{"ip": "::1", "otp": "935593", "phone": "9999911111", "attempts": 0, "otpSentAt": "2025-08-15T16:54:12.890Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T16:54:21.678Z", "loginSuccessful": true}
cme8ugxh00001257ngdyb8zr5	cme340fhk00011t4shpymtom2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWUzNDBmaHYwMDAzMXQ0czN5YWZnNTIzIiwicGhvbmUiOiI2MzU0ODYyNzU1IiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiI0ZDBmMTQwZi0yMWY1LTRiZTAtOTg2Ny0zMjNjMDlhMWI5NWMiLCJpYXQiOjE3NTUwMjE0NzcsImV4cCI6MTc1NzYxMzQ3NywiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.mr0dyh90Gl7sI6fLX2GVv6w3CHxAiarPX9kcYErT4i8	t	2025-09-11 17:57:57.784	2025-08-12 17:57:50.58	2025-08-14 19:07:53.593	{"ip": "::1", "otp": "281690", "phone": "6354862755", "attempts": 0, "otpSentAt": "2025-08-12T17:57:50.579Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-12T17:57:57.784Z", "loginSuccessful": true}
cmebplsdg00013w0ci82i3pri	cme340fhk00011t4shpymtom2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWUzNDBmaHYwMDAzMXQ0czN5YWZnNTIzIiwicGhvbmUiOiI2MzU0ODYyNzU1IiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiJhZDM5Nzk1MC03NmNjLTQzYjgtYjVmNC0zZGY1MWE0ZTlhMzEiLCJpYXQiOjE3NTUxOTQ3MDYsImV4cCI6MTc1Nzc4NjcwNiwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.ZRgGNf_IwiRMmIfKo8V4gXOy8X1lh0awap2f6ACba-Q	t	2025-09-13 18:05:06.399	2025-08-14 18:04:57.7	2025-08-14 19:07:53.593	{"ip": "::1", "otp": "169384", "phone": "6354862755", "attempts": 0, "otpSentAt": "2025-08-14T18:04:57.699Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T18:05:06.399Z", "loginSuccessful": true}
cmed8lugb0003grny9ga1eay7	cmed0yrq30003ct6zvbt98vmj	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWVkMHlycTcwMDA1Y3Q2enlua241aWN6IiwicGhvbmUiOiI5OTk5OTAwMDAwIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6IjU2YTM2YjdjLWViOTctNGViNi1iYjBmLWEyMTVhY2U5NzhjOSIsImlhdCI6MTc1NTI4NzA4NCwiZXhwIjoxNzU3ODc5MDg0LCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.YbW1Mw5F6MHiCXM5HBPtZDLakoG2ksnM88c2ay25i9w	t	2025-09-14 19:44:44.605	2025-08-15 19:44:39.275	2025-08-15 20:23:01.816	{"ip": "::1", "otp": "338829", "phone": "9999900000", "attempts": 0, "otpSentAt": "2025-08-15T19:44:39.273Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T19:44:44.605Z", "loginSuccessful": true}
cme60zodm0007yx1kv6gobrl7	cme60zod60001yx1ksy05vzb8	b4b7fcb9-5f71-4e74-9df4-3145dd23058d	t	2025-08-17 18:37:04.425	2025-08-10 18:37:04.406	2025-08-16 20:21:21.58	\N
cmed0fjfv0001ct6zfys6rdu1	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiI0MTVhYzM4My1kMzUzLTQ0NDgtYWEyZi1iY2Y1NWYzYjczYjYiLCJpYXQiOjE3NTUyNzMzNTQsImV4cCI6MTc1Nzg2NTM1NCwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.56ev5dLUB1nX3ONGHw_FayC4IbLJ2L96AA9MlrhwQgc	t	2025-09-14 15:55:54.331	2025-08-15 15:55:48.139	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "110426", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-15T15:55:48.138Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T15:55:54.331Z", "loginSuccessful": true}
cmed3jo8l0003h95g5xj6vf8j	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiI3Yzg3NGNjNS1iYzBkLTQ5OWUtYmQ1Zi01OTg0Yjk2YTk1YzciLCJpYXQiOjE3NTUyNzg1ODksImV4cCI6MTc1Nzg3MDU4OSwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.jYH8k4JpUirqHRAuAb9UAcBmTZQm23AlUBqESTKrg4Y	t	2025-09-14 17:23:09.985	2025-08-15 17:22:59.829	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "561474", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-15T17:22:59.828Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T17:23:09.985Z", "loginSuccessful": true}
cmeek8th70007il0ixffeh18e	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNjcwOTMsImV4cCI6MTc1NTk3MTg5M30.d6zOrNx4BpzVN5hCpUFB61wOD5PqiRl3YV7_sTs8BK0	t	2025-08-23 17:58:13.05	2025-08-16 17:58:13.051	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmebs6be7000310t3meruaimu	cme8ssq950001uovg7maxef8w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU4c3NxOTgwMDAzdW92Z21mczBhY2J1IiwicGhvbmUiOiI5NjQzODkwMTEyIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6IjU5OTVjN2MxLTM2NWEtNDRjMS1hYzJlLWRlOTMwOTEzY2IxZiIsImlhdCI6MTc1NTE5OTAxOSwiZXhwIjoxNzU3NzkxMDE5LCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.cIDCDusj-CAAJL5a_E4VoWwZqHUWNGP2LMMRIhUo6CA	t	2025-09-13 19:16:59.633	2025-08-14 19:16:54.703	2025-08-15 07:13:34.131	{"ip": "::1", "otp": "752884", "phone": "9643890112", "attempts": 0, "otpSentAt": "2025-08-14T19:16:54.702Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T19:16:59.633Z", "loginSuccessful": true}
cme8ti7n70001itf53wl22axx	cme8ssq950001uovg7maxef8w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU4c3NxOTgwMDAzdW92Z21mczBhY2J1IiwicGhvbmUiOiI5NjQzODkwMTEyIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6IjAxNDMwY2UyLTA2N2QtNGFiYi04MTNmLWQ5ZDQ4YTZkMzA5YSIsImlhdCI6MTc1NTAxOTg2MCwiZXhwIjoxNzU3NjExODYwLCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.XbRKJS44vby7slScUD4JTnzzeyWw7icMYqBTVhPlZLw	t	2025-09-11 17:31:00.441	2025-08-12 17:30:50.804	2025-08-15 07:13:34.131	{"ip": "::1", "otp": "994145", "phone": "9643890112", "attempts": 0, "otpSentAt": "2025-08-12T17:30:50.803Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-12T17:31:00.441Z", "loginSuccessful": true}
cme8u373u0001saf10pz7z7ek	cme8ssq950001uovg7maxef8w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU4c3NxOTgwMDAzdW92Z21mczBhY2J1IiwicGhvbmUiOiI5NjQzODkwMTEyIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6IjBiMmMzOWQxLWJlMDItNGUxMC05NmY5LTY5Y2NhZjdlNjYwNCIsImlhdCI6MTc1NTAyMDgzNiwiZXhwIjoxNzU3NjEyODM2LCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.CRNlbbLu0X4xaEW-LOSWHvcmikTMCTaRxEewEHwauKE	t	2025-09-11 17:47:16.731	2025-08-12 17:47:09.882	2025-08-15 07:13:34.131	{"ip": "::1", "otp": "412742", "phone": "9643890112", "attempts": 0, "otpSentAt": "2025-08-12T17:47:09.881Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-12T17:47:16.731Z", "loginSuccessful": true}
cmed4hgz2000196te9dkvil64	cmed17tby00013oz98cs4ym31	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWVkMTd0YzAwMDAzM296OXNoODB5aGd4IiwicGhvbmUiOiI5OTk5OTExMTExIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6Ijk0N2M2N2QzLTRhYWMtNDcyOC1hODU5LTI1ZTRlZjRiNTRkNiIsImlhdCI6MTc1NTI4MDE2MiwiZXhwIjoxNzU3ODcyMTYyLCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.X_eg8-IaHPU5UKIfmUohl0ZlguzjEXeor04FZBMhc6U	t	2025-09-14 17:49:22.841	2025-08-15 17:49:16.719	2025-08-15 17:54:33.759	{"ip": "::1", "otp": "634839", "phone": "9999911111", "attempts": 0, "otpSentAt": "2025-08-15T17:49:16.718Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T17:49:22.841Z", "loginSuccessful": true}
cmebruk94000bx71y9hlajn4u	cme340fhk00011t4shpymtom2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWUzNDBmaHYwMDAzMXQ0czN5YWZnNTIzIiwicGhvbmUiOiI2MzU0ODYyNzU1IiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiJjZjljZWUyYS00MmI0LTQ2NWQtYTM4OS05MWRlYTYyMWEzMWUiLCJpYXQiOjE3NTUxOTg0NzIsImV4cCI6MTc1Nzc5MDQ3MiwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.la-Gbvlr3pQyMbTEyOzVyw6M62fqvoDn8eV7dx27bxs	t	2025-09-13 19:07:52.539	2025-08-14 19:07:46.313	2025-08-14 19:07:53.593	{"ip": "::1", "otp": "169259", "phone": "6354862755", "attempts": 0, "otpSentAt": "2025-08-14T19:07:46.312Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T19:07:52.539Z", "loginSuccessful": true}
cmed2khyz0009k8yc1uv4ww46	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiJiY2IyMzJhMi0yZTc1LTRlNmQtYmM2ZC0yNTk0OWU1MDdiMTAiLCJpYXQiOjE3NTUyNzY5NDQsImV4cCI6MTc1Nzg2ODk0NCwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.jQB0lciHqed5pfafWpzD8JtkRyxVF1h8w7wr5KpE5n4	t	2025-09-14 16:55:44.959	2025-08-15 16:55:38.748	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "362227", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-15T16:55:38.747Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T16:55:44.959Z", "loginSuccessful": true}
cmebrtas20009x71yh9dt6y9p	cme8ssq950001uovg7maxef8w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU4c3NxOTgwMDAzdW92Z21mczBhY2J1IiwicGhvbmUiOiI5NjQzODkwMTEyIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6IjM0MDQwM2Y4LTE0ZTUtNDFiNi04NTA1LTc3MzM0ZTM4NzIyOSIsImlhdCI6MTc1NTE5ODQxMywiZXhwIjoxNzU3NzkwNDEzLCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.LD0iIXPUc-lmIw4Nkyg3GjGLt5nW2RppWhby8-aWQaA	t	2025-09-13 19:06:53.497	2025-08-14 19:06:47.378	2025-08-15 07:13:34.131	{"ip": "::1", "otp": "836088", "phone": "9643890112", "attempts": 0, "otpSentAt": "2025-08-14T19:06:47.377Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T19:06:53.497Z", "loginSuccessful": true}
cmeej1lln0003322mvz9mj5y8	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNjUwNzYsImV4cCI6MTc1NTk2OTg3Nn0.rdoi7_bwEsNaKxaXSPZpYQQzxPvMunj1QSjKZ9hF--0	t	2025-08-23 17:24:36.634	2025-08-16 17:24:36.635	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cme8streh0007uovgesckewcq	cme8ssq950001uovg7maxef8w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU4c3NxOTgwMDAzdW92Z21mczBhY2J1IiwicGhvbmUiOiI5NjQzODkwMTEyIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6IjExNjg2YmIxLWVmNGMtNGFmNC1hMmQyLTYwMmVkODUxNDU3MCIsImlhdCI6MTc1NTAxODcxNywiZXhwIjoxNzU3NjEwNzE3LCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.8yRrExuQLlzt3cJh82uGGiJpOps8O7QuihqO5g-yrAs	t	2025-09-11 17:11:57.56	2025-08-12 17:11:50.009	2025-08-15 07:13:34.131	{"ip": "::1", "otp": "982479", "phone": "9643890112", "attempts": 0, "otpSentAt": "2025-08-12T17:11:50.008Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-12T17:11:57.560Z", "loginSuccessful": true}
cmebrw703000fx71y6minihwf	cme8ssq950001uovg7maxef8w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU4c3NxOTgwMDAzdW92Z21mczBhY2J1IiwicGhvbmUiOiI5NjQzODkwMTEyIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6IjYyYzAxYzVmLTc2ZDgtNGI4MS1hMjQ5LTNmZjZkZTM0ZTU5MSIsImlhdCI6MTc1NTE5ODU0OCwiZXhwIjoxNzU3NzkwNTQ4LCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.j1wWBDuwLkZH-L-eL4Z3ZrdpD64KVY1jpKJy-Hf9QCg	t	2025-09-13 19:09:08.405	2025-08-14 19:09:02.451	2025-08-15 07:13:34.131	{"ip": "::1", "otp": "723610", "phone": "9643890112", "attempts": 0, "otpSentAt": "2025-08-14T19:09:02.450Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T19:09:08.405Z", "loginSuccessful": true}
cmebrb9bm0007qx9c28puujtn	cme8ssq950001uovg7maxef8w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU4c3NxOTgwMDAzdW92Z21mczBhY2J1IiwicGhvbmUiOiI5NjQzODkwMTEyIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6Ijk4YjNlYTFmLWI2YmQtNGU5ZC1iMTBmLTU2Njc5MjA1MDgxZiIsImlhdCI6MTc1NTE5NzU3MSwiZXhwIjoxNzU3Nzg5NTcxLCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.gLSH6iW00N2ZlDwa9KKjEh98AqIe5PS4hdcyJzNkHjQ	t	2025-09-13 18:52:51.423	2025-08-14 18:52:45.682	2025-08-15 07:13:34.131	{"ip": "::1", "otp": "481230", "phone": "9643890112", "attempts": 0, "otpSentAt": "2025-08-14T18:52:45.680Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T18:52:51.423Z", "loginSuccessful": true}
cmebr9ucu0001qx9cqdc6dwyc	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiI3NzA4NGJjZi0xZDg3LTQ1OTEtODYyYy1jY2Q2OWE3MmE5YjIiLCJpYXQiOjE3NTUxOTc1MTIsImV4cCI6MTc1Nzc4OTUxMiwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.E7JWkIwdaCuGS86zrZsrrwQ0LkCcQZJL2QLODeiqmvQ	t	2025-09-13 18:51:52.305	2025-08-14 18:51:39.63	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "816195", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-14T18:51:39.629Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T18:51:52.305Z", "loginSuccessful": true}
cmebr6mma0001c7tko9a2yhxq	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiJhMTlkMTFkMC05YTQzLTRhZWYtOTI0Mi1iMzFlNDYwYjEyZTEiLCJpYXQiOjE3NTUxOTczNTcsImV4cCI6MTc1Nzc4OTM1NywiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.3ihPcK6-aOUjBFyTLOxDwRmH_moqkaCwa2waPsm9gGo	t	2025-09-13 18:49:17.195	2025-08-14 18:49:09.634	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "104798", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-14T18:49:09.633Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T18:49:17.195Z", "loginSuccessful": true}
cmechp6xy0003x57uwniz9kny	cme8ssq950001uovg7maxef8w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU4c3NxOTgwMDAzdW92Z21mczBhY2J1IiwicGhvbmUiOiI5NjQzODkwMTEyIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6IjA2YzU3MTJjLWQ2YmYtNDRmMC1iMGViLTcyYzkyYTM4YTdkMiIsImlhdCI6MTc1NTI0MTg5NywiZXhwIjoxNzU3ODMzODk3LCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.OWdSxcc8fxMRtjNJ18jFExZQUCGrKqD1RslyzjBMI90	t	2025-09-14 07:11:37.122	2025-08-15 07:11:25.798	2025-08-15 07:13:34.131	{"ip": "::1", "otp": "302531", "phone": "9643890112", "attempts": 0, "otpSentAt": "2025-08-15T07:11:25.797Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T07:11:37.122Z", "loginSuccessful": true}
cmebsbitr000d10t3tt7c95f3	cme8ssq950001uovg7maxef8w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU4c3NxOTgwMDAzdW92Z21mczBhY2J1IiwicGhvbmUiOiI5NjQzODkwMTEyIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6ImFmNzNkMGRiLTJmMzktNGVlYi1iNGRmLTYyNTg3YmEzZTI0NCIsImlhdCI6MTc1NTE5OTI2MywiZXhwIjoxNzU3NzkxMjYzLCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.Z5vantuWyANwilVsJuPYaj-muhRSTLZ5HIT4QoM323I	t	2025-09-13 19:21:03.125	2025-08-14 19:20:57.616	2025-08-15 07:13:34.131	{"ip": "::1", "otp": "469534", "phone": "9643890112", "attempts": 0, "otpSentAt": "2025-08-14T19:20:57.615Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T19:21:03.125Z", "loginSuccessful": true}
cmeejm3bc00057uff78qaxbop	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNjYwMzIsImV4cCI6MTc1NTk3MDgzMn0.pZQWS-OSaLgJQV_2Ocgti26fy-x1qZGOAkcFIr4c2PM	t	2025-08-23 17:40:32.711	2025-08-16 17:40:32.712	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmed4ei8c0001ylnlat3f8bfc	cmed17tby00013oz98cs4ym31	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWVkMTd0YzAwMDAzM296OXNoODB5aGd4IiwicGhvbmUiOiI5OTk5OTExMTExIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6ImQ2YWVlMDA5LTdlMWEtNDE1MS04NzAzLTNkMDM5NDE1Yzg0OSIsImlhdCI6MTc1NTI4MDAyNCwiZXhwIjoxNzU3ODcyMDI0LCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.P4ls8iu8AAQHKORWJccX6mMSuAh-8B1ktPVR5faiBfo	t	2025-09-14 17:47:04.752	2025-08-15 17:46:58.38	2025-08-15 17:54:33.759	{"ip": "::1", "otp": "497959", "phone": "9999911111", "attempts": 0, "otpSentAt": "2025-08-15T17:46:58.380Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T17:47:04.752Z", "loginSuccessful": true}
cmed3v1l10003f0bwwj04vrw4	cmed17tby00013oz98cs4ym31	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWVkMTd0YzAwMDAzM296OXNoODB5aGd4IiwicGhvbmUiOiI5OTk5OTExMTExIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6IjM3ODkxNDFkLTZlOTMtNDVkOC05M2NlLTQwYjI2N2JhNWIzYyIsImlhdCI6MTc1NTI3OTExNSwiZXhwIjoxNzU3ODcxMTE1LCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.eQyg7eChmz_sC0WBlilGYMf-IH1Rs7RAsljtrP4tldA	t	2025-09-14 17:31:55.048	2025-08-15 17:31:50.341	2025-08-15 17:54:33.759	{"ip": "::1", "otp": "929535", "phone": "9999911111", "attempts": 0, "otpSentAt": "2025-08-15T17:31:50.341Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T17:31:55.048Z", "loginSuccessful": true}
cmeeifx2m000hz43t3dgqcfpu	cme612nk60009yx1kgqonmviw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MTJuazYwMDA5eXgxa2dxb25tdml3IiwicGhvbmUiOiI5ODc2NTQzMjExIiwidXNlclR5cGUiOiJlbXBsb3llciIsImlhdCI6MTc1NTM2NDA2NSwiZXhwIjoxNzU1OTY4ODY1fQ.7l_6Z8vo1pRlXHHWBRjEuaILZB12-kmBkrnlqYBjM5s	t	2025-08-23 17:07:45.07	2025-08-16 17:07:45.071	2025-08-16 20:21:49.286	{"loginType": "dev-employer", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmeehzwex000bz43t9coh3ler	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNjMzMTcsImV4cCI6MTc1NTk2ODExN30.nEgKOJpEAyMqh5zBn_2tbRo_Ei7rqSOGEea8GZ8kK80	t	2025-08-23 16:55:17.72	2025-08-16 16:55:17.721	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmeekayz3000dil0i23p96rzm	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNjcxOTMsImV4cCI6MTc1NTk3MTk5M30.1lOsI2cmcvdQD1fPMnDXzxu4EJtty9kYpplaK5XdM9M	t	2025-08-23 17:59:53.486	2025-08-16 17:59:53.487	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmebqc8rp00012f1q6owj7cr0	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiJlYTU3MjliZC04Y2YxLTRmZTEtYTkwNi01MTU4ODU1ZjA3YWQiLCJpYXQiOjE3NTUxOTU5MzgsImV4cCI6MTc1Nzc4NzkzOCwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.0X0ih4Iv2upFwv3tAtGjrTaOvKdl7wGpGVkJongnsPs	t	2025-09-13 18:25:38.904	2025-08-14 18:25:32.005	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "665154", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-14T18:25:32.004Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T18:25:38.904Z", "loginSuccessful": true}
cmeejqior0001jzggukhv9xn5	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNjYyMzksImV4cCI6MTc1NTk3MTAzOX0.oRbUVqCQtue7QtRBxcwOj1W41u3adzfqQTLnTOsEPX4	t	2025-08-23 17:43:59.258	2025-08-16 17:43:59.259	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmed2lajh000dk8ycntiszrq8	cmed17tby00013oz98cs4ym31	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWVkMTd0YzAwMDAzM296OXNoODB5aGd4IiwicGhvbmUiOiI5OTk5OTExMTExIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6ImFmMTMyNGRiLTIyNWQtNDlhMi04MzQzLWI5NmI5M2QwOWYwOSIsImlhdCI6MTc1NTI3Njk4MCwiZXhwIjoxNzU3ODY4OTgwLCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.90A2afINslJtETuQY5MFoENdynO8OFPU9Vv0FQoWpTc	t	2025-09-14 16:56:20.793	2025-08-15 16:56:15.773	2025-08-15 17:54:33.759	{"ip": "::1", "otp": "287540", "phone": "9999911111", "attempts": 0, "otpSentAt": "2025-08-15T16:56:15.771Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T16:56:20.793Z", "loginSuccessful": true}
cmebpp71a00033w0cfdcdhgp0	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiJiMGMxN2IwMS1hZTIxLTRmZWEtODRjZS03ZjNmM2I3ZmM0ZWEiLCJpYXQiOjE3NTUxOTQ4NjMsImV4cCI6MTc1Nzc4Njg2MywiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.X4ojaODVxw2zOMTzdLYNr-JI3IfbHaHEwmjmH_NGaTo	t	2025-09-13 18:07:43.279	2025-08-14 18:07:36.67	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "213071", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-14T18:07:36.669Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T18:07:43.279Z", "loginSuccessful": true}
cmeej4dgn0005322mbqlq6vq4	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNjUyMDYsImV4cCI6MTc1NTk3MDAwNn0.zq6Xz_8wd1k1JVi_ZO1LwqsUfdpZFc3sIfYWw6gPZZ8	t	2025-08-23 17:26:46.053	2025-08-16 17:26:46.055	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmeejo0kh00077ufftyp7rqr4	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNjYxMjIsImV4cCI6MTc1NTk3MDkyMn0.4FJ2LVjSgFfO865lFi032A4HnxqOt37vHvKcfwhRPGY	t	2025-08-23 17:42:02.464	2025-08-16 17:42:02.465	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmedaim7u0007kkbdg8w6lyv5	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUyOTAyODcsImV4cCI6MTc1NTg5NTA4N30.09E5QBBwCFu9QbI9kAvERjX_govE_8S0J7xK_3dVltI	t	2025-08-22 20:38:07.865	2025-08-15 20:38:07.866	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmed46wjc00012h94f05i4rgs	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiIyNDU2NGQ3My1kZjhmLTRkMGUtYmMwZC01NDA0NTU1YWU1ODEiLCJpYXQiOjE3NTUyNzk2NzMsImV4cCI6MTc1Nzg3MTY3MywiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.ZQSBRKfOkHXT9Oe4XC3JMhNs0-oIUe2QThwRo9aVvk0	t	2025-09-14 17:41:13.196	2025-08-15 17:41:03.672	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "748191", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-15T17:41:03.672Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T17:41:13.196Z", "loginSuccessful": true}
cmeelm2kv00058iw5e5f86n1x	cme612nk60009yx1kgqonmviw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MTJuazYwMDA5eXgxa2dxb25tdml3IiwicGhvbmUiOiI5ODc2NTQzMjExIiwidXNlclR5cGUiOiJlbXBsb3llciIsImlhdCI6MTc1NTM2OTM5MCwiZXhwIjoxNzU1OTc0MTkwfQ.KnHt4uV_sx1ymCLPKLLZO7D962lJku1CQd6HQEvZQsg	t	2025-08-23 18:36:30.99	2025-08-16 18:36:30.991	2025-08-16 20:21:49.286	{"loginType": "dev-employer", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmeep9rx00001y2src19nkh7x	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNzU1MzUsImV4cCI6MTc1NTk4MDMzNX0.uw7U5371zJ2PH1AoqRqWc3uqxOecNnHr5vYhzkFXTEM	t	2025-08-23 20:18:55.763	2025-08-16 20:18:55.764	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmeejex2700017uff5warudu4	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNjU2OTgsImV4cCI6MTc1NTk3MDQ5OH0.HoIFKUu2vk5unmUl0byrNfytY4hllxz_MHrzNt2apKQ	t	2025-08-23 17:34:58.014	2025-08-16 17:34:58.015	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmedagfv50005kkbdiz54c3kc	cme612nk60009yx1kgqonmviw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MTJuazYwMDA5eXgxa2dxb25tdml3IiwicGhvbmUiOiI5ODc2NTQzMjExIiwidXNlclR5cGUiOiJlbXBsb3llciIsImlhdCI6MTc1NTI5MDE4NiwiZXhwIjoxNzU1ODk0OTg2fQ.r3YW-HlaHFY-EEfnQ4WP7BN6ovHXww6Q56n5wp2wwpg	t	2025-08-22 20:36:26.321	2025-08-15 20:36:26.322	2025-08-16 20:21:49.286	{"loginType": "dev-employer", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmed1e66200073oz93tnmvbhx	cmed17tby00013oz98cs4ym31	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWVkMTd0YzAwMDAzM296OXNoODB5aGd4IiwicGhvbmUiOiI5OTk5OTExMTExIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6IjAwMTk2MDllLWUxYWItNGY1ZC1iMDlmLWI2MjZhMTYxNGExMCIsImlhdCI6MTc1NTI3NDk3NiwiZXhwIjoxNzU3ODY2OTc2LCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.psxarnUwRYb5i016xwDEIDU0gU3aO6ilScXY7jJCSJs	t	2025-09-14 16:22:56.927	2025-08-15 16:22:43.899	2025-08-15 17:54:33.759	{"ip": "::1", "otp": "107129", "phone": "9999911111", "attempts": 0, "otpSentAt": "2025-08-15T16:22:43.898Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T16:22:56.927Z", "loginSuccessful": true}
cmed4ko250001zqc9f6pmiegc	cmed17tby00013oz98cs4ym31	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWVkMTd0YzAwMDAzM296OXNoODB5aGd4IiwicGhvbmUiOiI5OTk5OTExMTExIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6ImUzOTYxMDBjLTA5NjctNGYxYS05NjNiLTk5NzYxNWM0NGE1ZSIsImlhdCI6MTc1NTI4MDMxMSwiZXhwIjoxNzU3ODcyMzExLCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.UjMIu3dUuU970N2MAYu7v_jy5o8yEDglJUIB19Cpjwc	t	2025-09-14 17:51:51.634	2025-08-15 17:51:45.87	2025-08-15 17:54:33.759	{"ip": "::1", "otp": "680345", "phone": "9999911111", "attempts": 0, "otpSentAt": "2025-08-15T17:51:45.869Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T17:51:51.634Z", "loginSuccessful": true}
cmed4o4w1000dzqc966s83wv8	cmed17tby00013oz98cs4ym31	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWVkMTd0YzAwMDAzM296OXNoODB5aGd4IiwicGhvbmUiOiI5OTk5OTExMTExIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6ImU5M2U0MTJlLTNiY2YtNDZhMi05YTU0LWQ5ODk5NTJhMmNkYiIsImlhdCI6MTc1NTI4MDQ3MiwiZXhwIjoxNzU3ODcyNDcyLCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.rbmqdIDfUZkOegv5YQBMC8tQR1j8zOgS-Ft37F2V-9g	t	2025-09-14 17:54:32.692	2025-08-15 17:54:27.65	2025-08-15 17:54:51.33	{"ip": "::1", "otp": "728949", "phone": "9999911111", "attempts": 0, "otpSentAt": "2025-08-15T17:54:27.649Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T17:54:32.692Z", "loginSuccessful": true}
cmeejrili0003jzgg0oc40dza	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNjYyODUsImV4cCI6MTc1NTk3MTA4NX0.xdcdZ8FwDFcY0Yp2_DMMmuNEdKCu-efaJBb9Nhlv6w4	t	2025-08-23 17:44:45.796	2025-08-16 17:44:45.797	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmedael8z0001kkbdbv3qu4ud	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUyOTAwOTksImV4cCI6MTc1NTg5NDg5OX0._Aeow86HY4zSb6W9pbINEz4ldXBO4jfgywERT2lGZ9s	t	2025-08-22 20:34:59.986	2025-08-15 20:34:59.987	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmebrzx40000lx71ye0vajiio	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiI2NTU1ZGI3Yi1hNjg2LTQ0ZTItYTU3Ny1mMjA1NzU4ZWRhN2IiLCJpYXQiOjE3NTUxOTg3MjEsImV4cCI6MTc1Nzc5MDcyMSwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.ZRSFWKI7zwYbWx4eci0T3dToJ5vqRfJNsIrFDeKJrbM	t	2025-09-13 19:12:01.45	2025-08-14 19:11:56.256	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "161132", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-14T19:11:56.255Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T19:12:01.450Z", "loginSuccessful": true}
cmechohvx0001x57ubtwqdcjr	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiIyYzY0YzIwMC0yN2E0LTQ4NTgtOWVkMi0zYTNmZjY1MzMxNGYiLCJpYXQiOjE3NTUyNDE4NjAsImV4cCI6MTc1NzgzMzg2MCwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.hKvxVs-AtJGYw8xCvJOqIiMmdf4jaaUW7KKD79RrJAk	t	2025-09-14 07:11:00.929	2025-08-15 07:10:53.325	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "203677", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-15T07:10:53.324Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T07:11:00.929Z", "loginSuccessful": true}
cmeek8lhf0005il0i2htz6ner	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNjcwODIsImV4cCI6MTc1NTk3MTg4Mn0.yqKkpuaIRoKl05zq-GC7P7JBuRX3zmWLiJIKYYqb5ns	t	2025-08-23 17:58:02.69	2025-08-16 17:58:02.691	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmebrvenz000dx71yewk058x2	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiJmN2QzMTZhMy03N2JlLTQ5ZTEtYmM3Mi00NzA5ZWZhZWI3MjkiLCJpYXQiOjE3NTUxOTg1MTEsImV4cCI6MTc1Nzc5MDUxMSwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.bZL13oAensW_YM2lMpy8UvG7B13tM5hMAnHM_jsVWRg	t	2025-09-13 19:08:31.19	2025-08-14 19:08:25.727	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "885934", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-14T19:08:25.726Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T19:08:31.190Z", "loginSuccessful": true}
cmeepdgzf000512wr009y6599	cme612nk60009yx1kgqonmviw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MTJuazYwMDA5eXgxa2dxb25tdml3IiwicGhvbmUiOiI5ODc2NTQzMjExIiwidXNlclR5cGUiOiJlbXBsb3llciIsImlhdCI6MTc1NTM3NTcwOCwiZXhwIjoxNzU1OTgwNTA4fQ.KdTaIEK1VdhZr2bO1cPMhNIMABnMuOyfCPQEF19Dvr8	t	2025-08-23 20:21:48.218	2025-08-16 20:21:48.22	2025-08-16 20:24:23.612	{"loginType": "dev-employer", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmeek9nlo000bil0ipat8snmv	cme612nk60009yx1kgqonmviw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MTJuazYwMDA5eXgxa2dxb25tdml3IiwicGhvbmUiOiI5ODc2NTQzMjExIiwidXNlclR5cGUiOiJlbXBsb3llciIsImlhdCI6MTc1NTM2NzEzMiwiZXhwIjoxNzU1OTcxOTMyfQ.UYwfjRC2m6CN4lp8WB9bsDnlggQAkTjs7bUg05iPtC0	t	2025-08-23 17:58:52.091	2025-08-16 17:58:52.092	2025-08-16 20:21:49.286	{"loginType": "dev-employer", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmedb2kbm00036jfceob2zgr0	cme612nk60009yx1kgqonmviw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MTJuazYwMDA5eXgxa2dxb25tdml3IiwicGhvbmUiOiI5ODc2NTQzMjExIiwidXNlclR5cGUiOiJlbXBsb3llciIsImlhdCI6MTc1NTI5MTIxOCwiZXhwIjoxNzU1ODk2MDE4fQ.D-gLXQF_OYhs6m_3-9npEQTXjIFDcjcLcVJUlY6TRTA	t	2025-08-22 20:53:38.528	2025-08-15 20:53:38.53	2025-08-16 20:21:49.286	{"loginType": "dev-employer", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmeelh2py0003rs9ynnv10jil	cme612nk60009yx1kgqonmviw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MTJuazYwMDA5eXgxa2dxb25tdml3IiwicGhvbmUiOiI5ODc2NTQzMjExIiwidXNlclR5cGUiOiJlbXBsb3llciIsImlhdCI6MTc1NTM2OTE1NywiZXhwIjoxNzU1OTczOTU3fQ.cEDK0Tfz6mh3aEVUBwpB-TdJXjKLxzpx_1zIu3HtZuA	t	2025-08-23 18:32:37.894	2025-08-16 18:32:37.895	2025-08-16 20:21:49.286	{"loginType": "dev-employer", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmechf34b0003sua26n0112o4	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiJiZWFlMGQ4ZS0wY2FjLTQ2NDUtYWU4Yy1kMzZiZTAyOTgzMmIiLCJpYXQiOjE3NTUyNDE0MjMsImV4cCI6MTc1NzgzMzQyMywiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.m4fCG48ISyT8RaCtuReo3KOqtSi-Waup6VJnU3v7P24	t	2025-09-14 07:03:43.305	2025-08-15 07:03:34.283	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "737773", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-15T07:03:34.282Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T07:03:43.305Z", "loginSuccessful": true}
cmebsaauw000910t3csoyenrg	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiI4ODg3OWI5NC1lOWU2LTRjYjctYjA3OS1kMWExYzMzNGZlZTAiLCJpYXQiOjE3NTUxOTkyMDUsImV4cCI6MTc1Nzc5MTIwNSwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.UfLBQnQUmosATPpv626u7LUlMTv9Rpke0NEAXWwtAks	t	2025-09-13 19:20:05.998	2025-08-14 19:20:00.633	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "966651", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-14T19:20:00.632Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T19:20:05.998Z", "loginSuccessful": true}
cmed995zz0003bgy0v828i2hn	cmed0yrq30003ct6zvbt98vmj	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWVkMHlycTcwMDA1Y3Q2enlua241aWN6IiwicGhvbmUiOiI5OTk5OTAwMDAwIiwidXNlclR5cGUiOiJlbXBsb3llciIsInNlc3Npb25JZCI6ImRiMWU5NzNiLTBiNWEtNGJmMi1iODRkLTRiZWRjZjI1ZjVhMyIsImlhdCI6MTc1NTI4ODE3MSwiZXhwIjoxNzU3ODgwMTcxLCJhdWQiOiJuYW5vam9icy11c2VycyIsImlzcyI6Im5hbm9qb2JzIn0.ZiRBVuGY2EvXD8Npk7_5bnoPBi5fQcJ--j8Ep6e9OAY	t	2025-09-14 20:02:51.991	2025-08-15 20:02:47.328	2025-08-15 20:23:01.816	{"ip": "::1", "otp": "732000", "phone": "9999900000", "attempts": 0, "otpSentAt": "2025-08-15T20:02:47.325Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T20:02:51.991Z", "loginSuccessful": true}
cmed9yk2e000110byvzc7ydu2	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiI2YWU2ZGJlOS1hYzM1LTQwMWYtYWUyMy0wZTNjNjI2ZDQ0MWYiLCJpYXQiOjE3NTUyODkzNTgsImV4cCI6MTc1Nzg4MTM1OCwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.H9Vo05J_JDDpOg4PE9GlqQsj9P-f8qi2sH9NMVVH9xo	t	2025-09-14 20:22:38.078	2025-08-15 20:22:31.958	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "413064", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-15T20:22:31.957Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T20:22:38.078Z", "loginSuccessful": true}
cmebsetis000h10t3ap7krq8z	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiIxMzk3ODAwMC1iOTUwLTRmZDAtOTk4MS1kOGVlMGRmMGIyNDIiLCJpYXQiOjE3NTUxOTk0MTYsImV4cCI6MTc1Nzc5MTQxNiwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.ebSLNXYuCjynuwbKknxIBudV1XBoYe2jDeJEV4wpJr0	t	2025-09-13 19:23:36.683	2025-08-14 19:23:31.444	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "347185", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-14T19:23:31.443Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T19:23:36.683Z", "loginSuccessful": true}
cmebwslf20001mshxp9nub7kz	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiJkN2ZiZGQzNC02Mzg4LTRhNTAtYjJjYS1mN2IzMTBlNTdjMzgiLCJpYXQiOjE3NTUyMDY3ODIsImV4cCI6MTc1Nzc5ODc4MiwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.YKT03ff5f7TCaTcRl1ggxlbUl9V4XyxpC8v6KTGQRRY	t	2025-09-13 21:26:22.351	2025-08-14 21:26:12.59	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "846541", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-14T21:26:12.590Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T21:26:22.351Z", "loginSuccessful": true}
cmeek148k0001il0igvy7wbua	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNjY3MzMsImV4cCI6MTc1NTk3MTUzM30.gaBsIEPHxmId8Bm6fH4UF-SL0ey6OBkOaWpnvCafnOo	t	2025-08-23 17:52:13.747	2025-08-16 17:52:13.748	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmeda5e990001gymx4pd24oq3	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiI5MGUzNzAyNy1mZjlkLTQ0NzMtYjIxZi1hZmJmZjk5MjFkOTIiLCJpYXQiOjE3NTUyODk2NzksImV4cCI6MTc1Nzg4MTY3OSwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.8bdlEqvWfV8c_Q9NBygsbS956D1xGhLia9NHMkU05OI	t	2025-09-14 20:27:59.431	2025-08-15 20:27:51.022	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "375818", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-15T20:27:51.021Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T20:27:59.431Z", "loginSuccessful": true}
cmeehfvvu0009z43tfv2vp6rh	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNjIzODMsImV4cCI6MTc1NTk2NzE4M30.9NLxazcQQBxFgtIy8-EoVsqzWqcurH0wIOfnhDTClFc	t	2025-08-23 16:39:43.912	2025-08-16 16:39:43.914	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmed4ouri000hzqc9erti123i	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiI2Njk1ZmZkZC02ZDEyLTQ1ZjctYWY3Ny1lMjViMDdlNzFkY2UiLCJpYXQiOjE3NTUyODA1MDUsImV4cCI6MTc1Nzg3MjUwNSwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.3-gm6Glv3zaXKzu5ZVR-JoUaUCnmLnKPwgkUVXR1FB4	t	2025-09-14 17:55:05.383	2025-08-15 17:55:01.182	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "445638", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-15T17:55:01.181Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T17:55:05.383Z", "loginSuccessful": true}
cmeejim3400037uffb09uj3pe	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiJiNjIwYWRmOS02Mjg2LTQ1ZTEtOTVjOS1lZTE4Nzg1OTkyNDEiLCJpYXQiOjE3NTUzNjU4NzgsImV4cCI6MTc1Nzk1Nzg3OCwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.HjIxL2zQ5Fuvg_47ltmc7aNhrjWCjcRwZAQMZDZpLYg	t	2025-09-15 17:37:58.089	2025-08-16 17:37:50.416	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "366452", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-16T17:37:50.414Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-16T17:37:58.089Z", "loginSuccessful": true}
cmedairhw0009kkbd30dplhfr	cme612nk60009yx1kgqonmviw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MTJuazYwMDA5eXgxa2dxb25tdml3IiwicGhvbmUiOiI5ODc2NTQzMjExIiwidXNlclR5cGUiOiJlbXBsb3llciIsImlhdCI6MTc1NTI5MDI5NCwiZXhwIjoxNzU1ODk1MDk0fQ.2ymVGrIWvqvOwtsZdvEJNqSAApmt_P3j9iajMbX_eNc	t	2025-08-22 20:38:14.707	2025-08-15 20:38:14.709	2025-08-16 20:21:49.286	{"loginType": "dev-employer", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmebs58yi000110t30oqp0lwa	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiIxYTI1YTE2OS1iYWE3LTQzMGMtYTIwOC04ZmNlNjJkOGQ3MzQiLCJpYXQiOjE3NTUxOTg5NzIsImV4cCI6MTc1Nzc5MDk3MiwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.Tz33bkL5RW5LjKydOMOcrbBemT1ivq1uMryIx-fMGls	t	2025-09-13 19:16:12.116	2025-08-14 19:16:04.89	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "218338", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-14T19:16:04.889Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T19:16:12.116Z", "loginSuccessful": true}
cmeehccmb0003z43tbv3ov4t3	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNjIyMTgsImV4cCI6MTc1NTk2NzAxOH0.5KF3XaWRk4gJrvFsbNN6qtHqReq0ObiO6u_-kyKv4DE	t	2025-08-23 16:36:58.978	2025-08-16 16:36:58.979	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmed4mzyb0009zqc9lywjoxur	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiI0OGIyZGFiOC1jYzQyLTQwOTAtOGMxMC02YjQzNDEyZDY5MTkiLCJpYXQiOjE3NTUyODA0MjIsImV4cCI6MTc1Nzg3MjQyMiwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.DOiZH_bNxjRpZyyGpdVMmJWfW4YU1HwPU7oyCv6RG9M	t	2025-09-14 17:53:42.088	2025-08-15 17:53:34.595	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "218614", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-15T17:53:34.594Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T17:53:42.088Z", "loginSuccessful": true}
cmed98sg90001bgy0flstn37t	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiI0YjI2OTY4Zi1kOTExLTRiMDEtOWM4OC0zNDMyZmMyMjI1ZDMiLCJpYXQiOjE3NTUyODgxNTUsImV4cCI6MTc1Nzg4MDE1NSwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.twg4M84wnPilr-La-ISSb7_NuVBypbQIDZs_JZYKbOg	t	2025-09-14 20:02:35.828	2025-08-15 20:02:29.769	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "312178", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-15T20:02:29.768Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T20:02:35.828Z", "loginSuccessful": true}
cmed3maqq0007h95gbueg2fq3	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiIyYmU3NGE4My1iYmUzLTQ4ODgtYjlkMS1jMjIxZmNmMTQ1NjgiLCJpYXQiOjE3NTUyNzg3MDksImV4cCI6MTc1Nzg3MDcwOSwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.FmQvQ2sgzIb0s4xWpNU6xn30XsOtVNwQNgXEi2WmHmg	t	2025-09-14 17:25:09.325	2025-08-15 17:25:02.307	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "608311", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-15T17:25:02.306Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T17:25:09.325Z", "loginSuccessful": true}
cmed32i07000hk8yco90p5pih	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiJmNTNhMjE2Mi05YzhhLTRhMzktYWVlMi03N2Q2YmMyMTJhMTIiLCJpYXQiOjE3NTUyNzc3ODcsImV4cCI6MTc1Nzg2OTc4NywiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.Hpk28gRrQP4iQ6_o62r2ETbc85D-oyc-ZZT-T6nonR0	t	2025-09-14 17:09:47.515	2025-08-15 17:09:38.599	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "689195", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-15T17:09:38.598Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T17:09:47.515Z", "loginSuccessful": true}
cmed3tzdq0001f0bwca38evgb	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiJjMDUyNGIwZC05YmQwLTQxZGYtYmI4YS1hZjM3NmJiYzIwZjMiLCJpYXQiOjE3NTUyNzkwNjksImV4cCI6MTc1Nzg3MTA2OSwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.qDouwoZrlEBg4T7Xyehs_gLWTPA43zTF2eCjFpxGYnQ	t	2025-09-14 17:31:09.757	2025-08-15 17:31:00.831	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "550361", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-15T17:31:00.830Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T17:31:09.757Z", "loginSuccessful": true}
cmeelhr750009rs9yqsim0xhn	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNjkxODksImV4cCI6MTc1NTk3Mzk4OX0.RrZSRHqF70ELtXZoS09zBC7JB7RiAtKdBR4R9dIRozc	t	2025-08-23 18:33:09.615	2025-08-16 18:33:09.618	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmed8ku450001grnyxmsqgt4g	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiJjYWVhOWU2ZS05ZTA2LTQ5OTctOTBhNy1kNTEwOGY2NjFiZWIiLCJpYXQiOjE3NTUyODcwNDEsImV4cCI6MTc1Nzg3OTA0MSwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.GoHSJ3P3Ba-OwAVk9MmHfTubixiF9_dIFAZ7iB3tkcE	t	2025-09-14 19:44:01.076	2025-08-15 19:43:52.181	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "245312", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-15T19:43:52.180Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T19:44:01.076Z", "loginSuccessful": true}
cmeej1gma0001322ms7ersuxe	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNjUwNzAsImV4cCI6MTc1NTk2OTg3MH0.s6BA1EjTph33Hc0IL-0EHP0M61sigLKKf8jJSzzuHUU	t	2025-08-23 17:24:30.178	2025-08-16 17:24:30.179	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmeei6521000dz43tpv8ny0y4	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZDYwMDAxeXgxa3N5MDV2emI4IiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJpYXQiOjE3NTUzNjM2MDgsImV4cCI6MTc1NTk2ODQwOH0.Jwm61_n34or8vQIMHXdneTB6j5IUBC7Q7rGf2uubcF8	t	2025-08-23 17:00:08.856	2025-08-16 17:00:08.857	2025-08-16 20:21:21.58	{"loginType": "dev-worker", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}
cmechbwqu0001sua26sydn8h0	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiIwZmExODlhOS02NDBkLTQ0ZDYtYTNlMS02NDI1YTI3ZjJiYzIiLCJpYXQiOjE3NTUyNDEyNzcsImV4cCI6MTc1NzgzMzI3NywiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.xWXDRvl0LNqr5DlFpKm3bh3FybKLX8Wfy7EO4IPD_t4	t	2025-09-14 07:01:17.842	2025-08-15 07:01:06.054	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "835122", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-15T07:01:06.053Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T07:01:17.842Z", "loginSuccessful": true}
cmed37vdr0001h95g12a5nh71	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiI4ZmQ1YzE0OC1mYTM4LTQ1MGEtOTU1MC0zZjgwMWQ2YjA1M2YiLCJpYXQiOjE3NTUyNzgwMzYsImV4cCI6MTc1Nzg3MDAzNiwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.HqQyBC9288kaH14oQwTEoWU0T0MhmIXP5V8cX4jgn_s	t	2025-09-14 17:13:56.273	2025-08-15 17:13:49.216	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "772216", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-15T17:13:49.215Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-15T17:13:56.273Z", "loginSuccessful": true}
cmebq4y760001lr27c530c0vy	cme60zod60001yx1ksy05vzb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU2MHpvZGIwMDAzeXgxazFjZHFxYjVvIiwicGhvbmUiOiI5ODc2NTQzMjEwIiwidXNlclR5cGUiOiJ3b3JrZXIiLCJzZXNzaW9uSWQiOiIxNDU5MDk0Zi0zNzY0LTRmYzItYmY1NS1hZDViMGRmNjMxMzEiLCJpYXQiOjE3NTUxOTU1OTgsImV4cCI6MTc1Nzc4NzU5OCwiYXVkIjoibmFub2pvYnMtdXNlcnMiLCJpc3MiOiJuYW5vam9icyJ9.iMgeYSv5t7OxNIl_AdAj_l9dysksZINBus4FQ1Vm8PM	t	2025-09-13 18:19:58.295	2025-08-14 18:19:51.714	2025-08-16 20:21:21.58	{"ip": "::1", "otp": "253292", "phone": "9876543210", "attempts": 0, "otpSentAt": "2025-08-14T18:19:51.713Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "verifiedAt": "2025-08-14T18:19:58.295Z", "loginSuccessful": true}
\.


--
-- Data for Name: system_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_config (id, key, value, description, "updatedAt") FROM stdin;
\.


--
-- Data for Name: task_applications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_applications (id, "taskId", "workerId", status, message, "proposedRate", "appliedAt", "respondedAt", "completedAt") FROM stdin;
\.


--
-- Data for Name: task_attachments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_attachments (id, "taskId", "fileName", "filePath", "fileSize", "mimeType", "fileType", description, "isRequired", "uploadedAt") FROM stdin;
cmed4l9zn0005zqc9gri3v003	cmed4l9zg0003zqc98mfzwwcf	Screenshot 2025-08-15 at 8.40.22 PM.png	/Users/harshilpatel/Documents/nanojobs/backend/uploads/task-attachments/task_1755280334280_d3da18b3_Screenshot_2025-08-15_at_8.40.22_PM.png	194053	image/png	image	Attachment 1	f	2025-08-15 17:52:14.292
cmeeioemv000xz43tin5xdf33	cmeeihflq000lz43thc8f4wf4	Book 16 Aug 2025.pdf	/Users/harshilpatel/Documents/nanojobs/backend/uploads/task-attachments/task_1755364461059_9419e555_Book_16_Aug_2025.pdf	1936996	application/pdf	document	Attachment 1	f	2025-08-16 17:14:21.08
\.


--
-- Data for Name: task_chats; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_chats (id, "taskId", "workerId", "employerId", "isActive", "createdAt", "updatedAt") FROM stdin;
cmeelkoh700018iw5u9zbm2z9	cmeelhj1s0005rs9yfb14fzh0	cme60zodb0003yx1k1cdqqb5o	cmedagfuo0003kkbdwo4o8sbi	t	2025-08-16 18:35:26.059	2025-08-16 20:22:33.935
\.


--
-- Data for Name: task_submission_files; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_submission_files (id, "submissionId", "fileName", "filePath", "fileSize", "mimeType", "fileType", description, "uploadedAt") FROM stdin;
cmeejrzny0007jzggvgyhkgjf	cmeejrznt0005jzggbobsdo99	itinerary (3).pdf	/Users/harshilpatel/Documents/nanojobs/backend/uploads/task-submissions/submission_1755366307891_effbf988_itinerary__3_.pdf	57871	application/pdf	document	File 1	2025-08-16 17:45:07.918
cmeek9gr60009il0iunwijdsf	cmeejrznt0005jzggbobsdo99	professors_list.xlsx	/Users/harshilpatel/Documents/nanojobs/backend/uploads/task-submissions/submission_1755367123207_a2b0663b_professors_list.xlsx	5378	application/vnd.openxmlformats-officedocument.spreadsheetml.sheet	document	File 1	2025-08-16 17:58:43.219
\.


--
-- Data for Name: task_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_submissions (id, "taskId", "workerId", "applicationId", "submissionType", "textContent", "submissionData", status, "submittedAt", "reviewedAt", "reviewNote", version, "isLatest", "previousVersionId") FROM stdin;
cmeejrznt0005jzggbobsdo99	cmeeihflq000lz43thc8f4wf4	cme60zodb0003yx1k1cdqqb5o	cmeeijy1j000rz43tgdfof71z	file	\N	{"links": [], "metadata": {"hasText": "", "hasFiles": true, "hasLinks": false, "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "submittedFromIP": "::1"}}	APPROVED	2025-08-16 17:45:07.913	2025-08-16 17:59:05.441	\N	2	t	cmeejrznt0005jzggbobsdo99
\.


--
-- Data for Name: trial_task_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trial_task_submissions (id, "trialTaskId", "workerId", "submittedWork", "timeSpent", "submittedAt", passed, "accuracyScore", "speedScore", "qualityScore", feedback, "autoEvaluated", "manuallyReviewed", "reviewedBy", "reviewedAt") FROM stdin;
\.


--
-- Data for Name: trial_tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trial_tasks (id, title, description, category, "payAmount", "timeLimit", difficulty, "accuracyThreshold", "speedThreshold", "qualityChecklist", "sampleData", instructions, "expectedOutput", "autoGrading", "manualReview", "isActive", "createdAt", "updatedAt") FROM stdin;
cme3vn87e0000v9bvztl6s23v	Customer Data Entry Challenge	Test your data entry skills by accurately entering customer information from a sample form. This trial evaluates your typing speed, attention to detail, and data formatting abilities.	DATA_ENTRY	75.00	20	beginner	90	2	{"requirements": ["All fields must be completed accurately", "Phone numbers in correct 10-digit format", "Valid email addresses with @ symbol", "Proper name capitalization", "No spelling errors in city names"], "passingCriteria": "Must achieve 90% accuracy with at least 8/10 entries completed"}	{"fields": ["name", "phone", "email", "city"], "entryCount": 10, "displayMode": "form_fields", "instructions": "Enter the following customer data exactly as shown", "sampleEntries": [{"city": "Mumbai", "name": "Rajesh Kumar", "email": "rajesh.kumar@email.com", "phone": "9876543210"}, {"city": "Delhi", "name": "Priya Sharma", "email": "priya.sharma@gmail.com", "phone": "9876543211"}, {"city": "Ahmedabad", "name": "Arjun Patel", "email": "arjun.patel@yahoo.com", "phone": "9876543212"}, {"city": "Hyderabad", "name": "Sneha Reddy", "email": "sneha.reddy@outlook.com", "phone": "9876543213"}, {"city": "Jaipur", "name": "Vikram Singh", "email": "vikram.singh@hotmail.com", "phone": "9876543214"}, {"city": "Pune", "name": "Anita Gupta", "email": "anita.gupta@email.com", "phone": "9876543215"}, {"city": "Kolkata", "name": "Rahul Verma", "email": "rahul.verma@gmail.com", "phone": "9876543216"}, {"city": "Chennai", "name": "Meera Iyer", "email": "meera.iyer@yahoo.com", "phone": "9876543217"}, {"city": "Bangalore", "name": "Suresh Joshi", "email": "suresh.joshi@email.com", "phone": "9876543218"}, {"city": "Kochi", "name": "Kavya Nair", "email": "kavya.nair@gmail.com", "phone": "9876543219"}]}	You will see a list of customer information displayed above the entry form. Your task is to:\n\n1. **Look at each customer's details carefully**\n2. **Enter the information in the corresponding form fields**\n3. **Ensure accuracy in all fields:**\n   - Names: Use proper capitalization (First Last)\n   - Phone: Enter exactly 10 digits (9876543210)\n   - Email: Include the complete email address\n   - City: Use proper capitalization\n\n**Tips for Success:**\n- Double-check each entry before moving to the next\n- Pay attention to spelling, especially for city names\n- Ensure phone numbers are exactly 10 digits\n- Type carefully to avoid errors\n\n**Evaluation Criteria:**\n- Accuracy: 90% or higher required to pass\n- Speed: Complete as many entries as possible within 20 minutes\n- Quality: Proper formatting and no spelling errors	{"format": "form_entries", "validation": {"city": "Non-empty string, proper capitalization", "name": "Non-empty string, proper capitalization", "email": "Valid email format with @ symbol", "phone": "Exactly 10 digits, numeric only"}, "totalEntries": 10, "requiredFields": ["name", "phone", "email", "city"]}	t	f	t	2025-08-09 06:31:53.163	2025-08-09 06:31:53.163
cme3vn87j0001v9bvn7qsjlhc	Product Description Writer Challenge	Showcase your content writing skills by creating compelling product descriptions. This trial tests your ability to write engaging, persuasive copy that would help customers make purchasing decisions.	CONTENT	100.00	25	beginner	85	\N	{"requirements": ["Write exactly 3 product descriptions", "Each description: 80-120 words", "Include ALL provided product features", "Use professional, persuasive language", "Focus on customer benefits", "Maintain consistent tone throughout"], "passingCriteria": "Minimum 300 words total, all features mentioned, professional quality"}	{"products": [{"name": "Premium Wireless Bluetooth Headphones", "features": ["Advanced noise cancellation technology", "30-hour extended battery life", "Foldable and portable design", "Touch gesture controls", "Premium leather headband", "Compatible with all devices"], "priceRange": "₹3,000 - ₹5,000", "targetAudience": "Music lovers, professionals, travelers"}, {"name": "Smart Fitness Tracker Watch", "features": ["24/7 heart rate monitoring", "Built-in GPS tracking", "Waterproof up to 50 meters", "Sleep pattern analysis", "7-day battery life", "Smartphone notifications"], "priceRange": "₹2,500 - ₹4,000", "targetAudience": "Fitness enthusiasts, health-conscious individuals"}, {"name": "Organic Premium Green Tea Collection", "features": ["100% certified organic tea leaves", "25 individually wrapped tea bags", "Natural weight management support", "Rich in antioxidants", "Ethically sourced from Indian gardens", "Zero artificial additives"], "priceRange": "₹400 - ₹600", "targetAudience": "Health enthusiasts, tea connoisseurs"}], "writingGuidelines": {"tone": "Professional yet engaging", "style": "Benefits-focused, customer-centric", "keywords": ["premium", "quality", "perfect", "ideal", "innovative", "designed"], "structure": "Opening hook + features + benefits + call to action"}}	Write compelling product descriptions that would convince customers to purchase these items. For each product:\n\n**Writing Requirements:**\n- **Word count**: 80-120 words per description\n- **Include ALL features** mentioned for each product\n- **Focus on benefits** - how does this help the customer?\n- **Use persuasive language** - make it appealing\n- **Professional tone** - suitable for e-commerce websites\n\n**Structure for each description:**\n1. **Opening** - Hook the customer's attention\n2. **Features** - Highlight key product features\n3. **Benefits** - Explain how it improves customer's life\n4. **Closing** - Create desire to purchase\n\n**Example opening:** "Experience the perfect blend of comfort and technology with..."\n\n**Tips for Success:**\n- Think like a customer - what would convince YOU to buy?\n- Use action words: experience, enjoy, discover, transform\n- Mention the target audience benefits\n- Keep sentences clear and engaging\n- Proofread for grammar and spelling\n\n**Evaluation focuses on:**\n- Completeness (all features mentioned)\n- Persuasiveness (compelling language)\n- Professional quality (grammar, structure)\n- Customer focus (benefits over features)	{"format": "text_content", "maxWords": 400, "minWords": 300, "structure": {"description1": "Wireless Headphones description (80-120 words)", "description2": "Fitness Tracker description (80-120 words)", "description3": "Green Tea description (80-120 words)"}, "productsCount": 3, "qualityMetrics": ["Word count compliance", "Feature inclusion rate", "Professional language use", "Persuasiveness score", "Grammar and spelling accuracy"]}	t	f	t	2025-08-09 06:31:53.168	2025-08-09 06:31:53.168
cme3vn87l0002v9bvv1tds5o4	Contact Database Organization Challenge	Test your organizational skills by converting messy contact information into a clean, structured database format. This trial evaluates your attention to detail, data formatting abilities, and organizational efficiency.	ORGANIZATION	80.00	15	beginner	92	3	{"requirements": ["Organize all 6 provided contacts", "Extract and separate: Name, Phone, Email, Company", "Use consistent formatting throughout", "Clean up formatting issues (extra spaces, inconsistent capitalization)", "Ensure no information is lost or duplicated"], "passingCriteria": "All contacts organized with 92% accuracy in formatting and completeness"}	{"rawContacts": ["John Smith - john.smith@techcorp.com - 9876543210 - Tech Corp Solutions", "Sarah Johnson, Marketing Director, sarah.j@innovatemarketing.in, +91-9876543211, Innovate Marketing Agency", "9876543212 | David Wilson | david.wilson@consultancy.co.in | Wilson Business Consultancy", "maria garcia - MARIA.GARCIA@financeplus.com - 9876543213 - Finance Plus Services", "Robert Brown, robert.brown@logistics.in, +91 98765 43214, Brown Logistics Pvt Ltd", "PRIYA SHAH - priya.shah@designstudio.com - 9876543215 - Creative Design Studio"], "targetFormat": {"columns": ["Name", "Phone", "Email", "Company"], "formatting": {"name": "Proper Case (First Last)", "email": "Lowercase, complete address", "phone": "10 digits only (9876543210)", "company": "Proper Case, no extra words"}}, "organizationInstructions": "The contacts above are in different formats. Your job is to organize them into a clean, consistent table format."}	You'll see 6 contacts in different messy formats above. Your task is to organize them into a clean, structured format:\n\n**Your Task:**\n1. **Extract information** from each messy contact entry\n2. **Organize into 4 columns**: Name | Phone | Email | Company\n3. **Apply consistent formatting** to all entries\n4. **Clean up any formatting issues**\n\n**Formatting Standards:**\n- **Names**: Use proper capitalization (John Smith, not JOHN SMITH or john smith)\n- **Phone Numbers**: Extract only the 10 digits (9876543210, remove +91, spaces, dashes)\n- **Emails**: Use lowercase, keep complete email address\n- **Company Names**: Use proper capitalization, remove extra words like "Pvt Ltd" if inconsistent\n\n**Example:**\nRaw: "JOHN SMITH - john.smith@COMPANY.COM - +91-98765-43210 - TECH COMPANY PVT LTD"\nOrganized: \n- Name: John Smith\n- Phone: 9876543210  \n- Email: john.smith@company.com\n- Company: Tech Company\n\n**Tips for Success:**\n- Look for patterns: name, email, phone can be in any order\n- Clean up capitalization (UPPERCASE → Proper Case)\n- Remove extra formatting from phone numbers\n- Be consistent with your formatting choices\n- Double-check that you've captured all information\n\n**Common Issues to Watch For:**\n- Phone numbers with +91, spaces, or dashes\n- Names in ALL CAPS or lowercase\n- Emails in mixed case\n- Missing information (some contacts might not have all fields)	{"format": "structured_data", "columns": ["Name", "Phone", "Email", "Company"], "validation": {"name": "Proper case formatting, no extra spaces", "email": "Lowercase, valid email format", "phone": "Exactly 10 digits, numeric only", "company": "Proper case, consistent naming"}, "contactCount": 6, "qualityMetrics": ["Data completeness (all contacts organized)", "Formatting consistency", "Information accuracy", "No data loss or duplication"]}	t	f	t	2025-08-09 06:31:53.17	2025-08-09 06:31:53.17
cme3vn87o0003v9bvbhj6j3pa	Email Response Writing Challenge	Test your professional communication skills by writing appropriate email responses to customer inquiries. This trial evaluates your ability to communicate clearly, professionally, and helpfully.	COMMUNICATION	90.00	20	beginner	88	\N	{"requirements": ["Write 3 professional email responses", "Address all customer concerns mentioned", "Maintain professional yet friendly tone", "Include proper email structure (greeting, body, closing)", "Provide helpful and actionable information", "Keep responses concise but complete"], "passingCriteria": "Professional quality responses that address all customer concerns"}	{"customerInquiries": [{"from": "rajesh.customer@email.com", "message": "Hi, I saw your wireless headphones online and I'm interested. Can you tell me more about the battery life? I need something that lasts for long flights. Also, do they come with a carrying case? Thanks!", "subject": "Question about wireless headphones battery life", "productContext": "Premium Wireless Bluetooth Headphones", "customerConcerns": ["Battery life duration", "Suitability for long flights", "Carrying case inclusion"]}, {"from": "priya.shopper@gmail.com", "message": "Hello, I want to order the fitness tracker but I need it by next Friday for a gift. What are your shipping options? Also, what if the person doesn't like it - can I return it? Please let me know the return policy.", "subject": "Shipping time and return policy", "productContext": "Smart Fitness Tracker Watch", "customerConcerns": ["Urgent delivery needed", "Shipping options", "Return policy details"]}, {"from": "arjun.tea@yahoo.com", "message": "I'm trying to lose weight and heard green tea helps. Is your organic green tea good for weight loss? How many cups should I drink per day? Are there any side effects I should know about?", "subject": "Green tea questions", "productContext": "Organic Premium Green Tea Collection", "customerConcerns": ["Weight loss benefits", "Daily consumption guidance", "Possible side effects"]}], "responseGuidelines": {"tone": "Professional yet friendly and helpful", "length": "100-150 words per response", "structure": "Greeting + Address concerns + Helpful information + Next steps + Professional closing", "keyElements": ["Address by name", "Thank for inquiry", "Answer all questions", "Provide helpful details", "Encourage next steps"]}}	Write professional email responses to the 3 customer inquiries shown above. Each response should address all the customer's questions and concerns professionally.\n\n**Response Structure:**\n1. **Professional greeting** (Dear [Name] or Hello [Name])\n2. **Thank them** for their inquiry\n3. **Address each concern** they mentioned\n4. **Provide helpful information** and details\n5. **Next steps** or call to action\n6. **Professional closing** (Best regards, Thank you, etc.)\n\n**Writing Guidelines:**\n- **Tone**: Professional but warm and helpful\n- **Length**: 100-150 words per response\n- **Address ALL concerns** mentioned by the customer\n- **Be specific** - give actual details, not vague answers\n- **Be helpful** - anticipate additional questions they might have\n\n**For Each Inquiry:**\n\n**Email 1 (Headphones)**: Address battery life, suitability for flights, carrying case\n**Email 2 (Fitness Tracker)**: Address urgent shipping, delivery options, return policy\n**Email 3 (Green Tea)**: Address weight loss benefits, usage instructions, safety\n\n**Tips for Success:**\n- Read each inquiry carefully - note ALL questions\n- Use the customer's name if provided\n- Give specific information (not just "yes, it's good")\n- Sound knowledgeable about the products\n- End with encouragement to purchase or ask more questions\n- Proofread for professional language and grammar\n\n**Example Opening:** "Dear Rajesh, Thank you for your interest in our Premium Wireless Bluetooth Headphones..."	{"format": "email_responses", "structure": {"response1": "Reply to headphones battery inquiry", "response2": "Reply to shipping and returns inquiry", "response3": "Reply to green tea benefits inquiry"}, "responseCount": 3, "qualityMetrics": ["Professional tone and structure", "All customer concerns addressed", "Helpful and specific information", "Appropriate length (100-150 words)", "Grammar and spelling accuracy", "Clear call to action"]}	t	f	t	2025-08-09 06:31:53.172	2025-08-09 06:31:53.172
cme3vn87q0004v9bvh4y96usv	Basic Research Task Challenge	Test your research and information gathering skills by finding specific information about Indian companies. This trial evaluates your ability to search effectively and present findings clearly.	RESEARCH	85.00	18	beginner	90	\N	{"requirements": ["Find information for all 3 companies", "Include all requested details for each company", "Verify information accuracy", "Present findings in clear, organized format", "Include sources where information was found"], "passingCriteria": "Complete and accurate information for all companies with proper formatting"}	{"researchTasks": [{"company": "Infosys", "requiredInfo": ["Headquarters location (city)", "Year founded", "Current CEO name", "Primary business/services", "Number of employees (approximate)"]}, {"company": "Flipkart", "requiredInfo": ["Headquarters location (city)", "Year founded", "Current CEO name", "Primary business/services", "Parent company (if any)"]}, {"company": "Tata Consultancy Services (TCS)", "requiredInfo": ["Headquarters location (city)", "Year founded", "Current CEO name", "Primary business/services", "Stock exchange listing (if applicable)"]}], "researchGuidelines": {"sources": "Use reliable sources like company websites, Wikipedia, business news sites", "accuracy": "Double-check information from multiple sources", "formatting": "Present information clearly for each company", "timeManagement": "Spend about 6 minutes per company"}}	Research the 3 Indian companies listed above and find the specific information requested for each. You'll need to search online and gather accurate, up-to-date information.\n\n**Your Task:**\nFor each company, find and provide:\n1. **Headquarters location** (which city)\n2. **Year founded** (when the company was established)\n3. **Current CEO name** (as of 2024)\n4. **Primary business/services** (what they do)\n5. **Additional specific info** (varies by company)\n\n**Research Tips:**\n- Start with the company's official website\n- Use reliable sources (Wikipedia, business news sites, official reports)\n- Cross-check information from multiple sources\n- Look for recent information (2023-2024)\n- If you can't find exact info, note "Information not available"\n\n**Formatting Your Answers:**\nPresent your findings clearly for each company:\n\n**Company Name:**\n- Headquarters: [City name]\n- Founded: [Year]\n- CEO: [Full name]\n- Business: [Brief description]\n- [Additional info]: [Details]\n\n**Example Format:**\n**Infosys:**\n- Headquarters: Bangalore\n- Founded: 1981\n- CEO: Salil Parekh\n- Business: IT services and consulting\n- Employees: Approximately 300,000\n\n**Time Management:**\n- Spend about 6 minutes per company\n- Don't get stuck on one detail - move on if info is hard to find\n- Focus on finding the most recent and accurate information\n\n**Evaluation Criteria:**\n- Accuracy of information found\n- Completeness (all requested details)\n- Clear formatting and presentation\n- Use of reliable sources	{"format": "research_findings", "structure": "Organized presentation of findings for each company", "companiesCount": 3, "qualityMetrics": ["Information accuracy and currency", "Completeness of all required fields", "Clear formatting and organization", "Use of reliable sources", "Professional presentation"], "requiredFields": ["headquarters", "founded", "ceo", "business", "additional"]}	t	f	t	2025-08-09 06:31:53.175	2025-08-09 06:31:53.175
\.


--
-- Data for Name: upi_mandates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.upi_mandates (id, "employerId", "upiId", "bankName", "accountLast4", "mandateRef", "maxAmount", "dailyLimit", "monthlyLimit", status, "validUntil", "isVerified", "verifiedAt", "createdAt", "updatedAt") FROM stdin;
cme8sudbx0009uovghzq3b4hx	cme8ssq980003uovgmfs0acbu	employer@hdfc	HDFC Bank	6913	UPI187384283453	5000.00	5000.00	5000.00	ACTIVE	2026-08-12 17:12:18.428	t	2025-08-12 17:12:18.428	2025-08-12 17:12:18.429	2025-08-12 17:12:18.429
cmed2j11i0003k8yc61s3zgef	cmed17tc000033oz9sh80yhgx	employer@sbi	State Bank of India	8128	UPI768701492386	5000.00	5000.00	5000.00	ACTIVE	2026-08-15 16:54:30.149	t	2025-08-15 16:54:30.149	2025-08-15 16:54:30.151	2025-08-15 16:54:30.151
cmed8m9s00005grnyqjuvnmu9	cmed0yrq70005ct6zynkn5icz	employer@hdfc	HDFC Bank	4599	UPI870991351213	50000.00	10000.00	50000.00	ACTIVE	2026-08-15 19:44:59.135	t	2025-08-15 19:44:59.135	2025-08-15 19:44:59.136	2025-08-15 19:44:59.136
cmeehe9wq0007z43t9ssu7cjt	cmedagfuo0003kkbdwo4o8sbi	employer@sbi	State Bank of India	8418	UPI623087779066	50000.00	10000.00	50000.00	ACTIVE	2026-08-16 16:38:28.777	t	2025-08-16 16:38:28.777	2025-08-16 16:38:28.779	2025-08-16 16:38:28.779
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, phone, email, name, "userType", "isActive", "createdAt", "updatedAt") FROM stdin;
cme340fhk00011t4shpymtom2	6354862755	\N	Harshil Patel	WORKER	t	2025-08-08 17:38:19.878	2025-08-08 17:38:19.878
cme60zod60001yx1ksy05vzb8	9876543210	test@example.com	Test Worker	WORKER	t	2025-08-10 18:37:04.406	2025-08-10 18:37:04.406
cme612nk60009yx1kgqonmviw	9876543211	test@example2.com	Testies	WORKER	t	2025-08-10 18:39:23.334	2025-08-10 18:39:23.334
cme618e1z000hyx1k9pq3w3mm	9484934049	\N	yoyouou	WORKER	t	2025-08-10 18:43:50.949	2025-08-10 18:43:50.949
cme61lfo2000313s0g75xz7jl	9643890333	\N	Nanojoba	WORKER	t	2025-08-10 18:53:59.567	2025-08-10 18:53:59.567
cme61n5v4000913s0y9a0shpd	9643890321	\N	xx	WORKER	t	2025-08-10 18:55:20.175	2025-08-10 18:55:20.175
cme8sg0kj0003dqq8u1hvr03b	9643890111	\N	Honey Singh	WORKER	t	2025-08-12 17:01:08.702	2025-08-12 17:01:08.702
cme8ssq950001uovg7maxef8w	9643890112	\N	Honey Singhs	EMPLOYER	t	2025-08-12 17:11:01.858	2025-08-12 17:11:01.858
cmed0yrq30003ct6zvbt98vmj	9999900000	\N	Super Employer	EMPLOYER	t	2025-08-15 16:10:45.339	2025-08-15 16:10:45.339
cmed17tby00013oz98cs4ym31	9999911111	\N	Super Company	EMPLOYER	t	2025-08-15 16:17:47.325	2025-08-15 16:17:47.325
\.


--
-- Data for Name: workers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.workers (id, "userId", badge, "badgeReason", skills, "experienceLevel", "estimatedHourlyRate", "registrationMethod", "isKYCCompleted", "isPhoneVerified", "isEmailVerified", availability, "preferredCategories", "registrationPath", "hasResume", "educationLevel", "availableHours", "previousWork", "averageAccuracy", "averageSpeed", "trialTasksCompleted", "trialTasksPassed", "bronzeBadgeEarned", "whatsappOptIn", "preferredLanguage", "mentorAssigned", "tasksCompleted", "averageRating", "workingHoursStart", "workingHoursEnd", timezone, "createdAt", "updatedAt", "upiId", "bankName", "totalEarnings") FROM stdin;
cme340fhv00031t4s3yafg523	cme340fhk00011t4shpymtom2	SILVER	Strong technical skills, multiple advanced projects, internship experience, leadership in technical competitions, demonstrating potential beyond entry-level	{Java,Python,React,Node.JS,"Machine Learning",IoT,AI,"Full Stack Development","Data Analysis"}	JUNIOR	250	RESUME	f	f	f	available	{"Web Development","Digital Marketing","Research & Analysis","Virtual Assistant","Content Writing"}	resume	f	\N	\N	\N	0	0	0	0	f	f	english	\N	0	\N	09:00	18:00	Asia/Kolkata	2025-08-08 17:38:19.878	2025-08-08 17:38:19.878	\N	\N	0.00
cme612nk8000byx1kyijp6m1z	cme612nk60009yx1kgqonmviw	BRONZE	Earned Bronze badge with 1/1 trials passed. Continue practicing to improve your skills.	{"Basic Skills"}	FRESHER	120	QUIZ	f	f	f	available	{data-entry}	simple_form	f	graduate	4	Some previous work experience	0	0	1	1	t	f	english	\N	0	\N	09:00	18:00	Asia/Kolkata	2025-08-10 18:39:23.334	2025-08-10 18:39:23.334	\N	\N	0.00
cme618e24000jyx1kq8wuhhzy	cme618e1z000hyx1k9pq3w3mm	SILVER	Strong technical skills, diverse project experience, research internship, and multiple achievements demonstrate potential beyond entry-level	{Java,Python,React,Node.js,"Machine Learning",IoT,"Mobile App Development"}	JUNIOR	250	RESUME	f	f	f	available	{"Web Development","Mobile App Development","Research & Analysis","Digital Marketing"}	resume	f	\N	\N	\N	0	0	0	0	f	f	english	\N	0	\N	09:00	18:00	Asia/Kolkata	2025-08-10 18:43:50.949	2025-08-10 18:43:50.949	\N	\N	0.00
cme60zodb0003yx1k1cdqqb5o	cme60zod60001yx1ksy05vzb8	BRONZE	Earned Bronze badge with 1/1 trials passed. Continue practicing to improve your skills.	{"Basic Skills"}	FRESHER	120	QUIZ	f	f	f	available	{data-entry}	simple_form	f	graduate	4	Some previous work experience	0	0	1	1	t	f	english	\N	8	\N	09:00	18:00	Asia/Kolkata	2025-08-10 18:37:04.406	2025-08-16 17:59:05.456	9876543210@paytm	\N	16800.00
\.


--
-- Name: badge_history badge_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_history
    ADD CONSTRAINT badge_history_pkey PRIMARY KEY (id);


--
-- Name: bronze_task_applications bronze_task_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bronze_task_applications
    ADD CONSTRAINT bronze_task_applications_pkey PRIMARY KEY (id);


--
-- Name: bronze_tasks bronze_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bronze_tasks
    ADD CONSTRAINT bronze_tasks_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: community_groups community_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_groups
    ADD CONSTRAINT community_groups_pkey PRIMARY KEY (id);


--
-- Name: community_memberships community_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_memberships
    ADD CONSTRAINT community_memberships_pkey PRIMARY KEY (id);


--
-- Name: employers employers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employers
    ADD CONSTRAINT employers_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: quiz_results quiz_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_results
    ADD CONSTRAINT quiz_results_pkey PRIMARY KEY (id);


--
-- Name: ratings ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (id);


--
-- Name: resumes resumes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT resumes_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: system_config system_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_pkey PRIMARY KEY (id);


--
-- Name: task_applications task_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_applications
    ADD CONSTRAINT task_applications_pkey PRIMARY KEY (id);


--
-- Name: task_attachments task_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT task_attachments_pkey PRIMARY KEY (id);


--
-- Name: task_chats task_chats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_chats
    ADD CONSTRAINT task_chats_pkey PRIMARY KEY (id);


--
-- Name: task_submission_files task_submission_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_submission_files
    ADD CONSTRAINT task_submission_files_pkey PRIMARY KEY (id);


--
-- Name: task_submissions task_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_submissions
    ADD CONSTRAINT task_submissions_pkey PRIMARY KEY (id);


--
-- Name: trial_task_submissions trial_task_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trial_task_submissions
    ADD CONSTRAINT trial_task_submissions_pkey PRIMARY KEY (id);


--
-- Name: trial_tasks trial_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trial_tasks
    ADD CONSTRAINT trial_tasks_pkey PRIMARY KEY (id);


--
-- Name: upi_mandates upi_mandates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upi_mandates
    ADD CONSTRAINT upi_mandates_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: workers workers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workers
    ADD CONSTRAINT workers_pkey PRIMARY KEY (id);


--
-- Name: _CompletedBy_AB_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "_CompletedBy_AB_unique" ON public."_CompletedBy" USING btree ("A", "B");


--
-- Name: _CompletedBy_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_CompletedBy_B_index" ON public."_CompletedBy" USING btree ("B");


--
-- Name: bronze_task_applications_bronzeTaskId_workerId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "bronze_task_applications_bronzeTaskId_workerId_key" ON public.bronze_task_applications USING btree ("bronzeTaskId", "workerId");


--
-- Name: community_memberships_workerId_groupId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "community_memberships_workerId_groupId_key" ON public.community_memberships USING btree ("workerId", "groupId");


--
-- Name: employers_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "employers_userId_key" ON public.employers USING btree ("userId");


--
-- Name: quiz_results_workerId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "quiz_results_workerId_key" ON public.quiz_results USING btree ("workerId");


--
-- Name: ratings_applicationId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ratings_applicationId_key" ON public.ratings USING btree ("applicationId");


--
-- Name: ratings_employerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ratings_employerId_idx" ON public.ratings USING btree ("employerId");


--
-- Name: ratings_ratedEmployerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ratings_ratedEmployerId_idx" ON public.ratings USING btree ("ratedEmployerId");


--
-- Name: ratings_ratedWorkerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ratings_ratedWorkerId_idx" ON public.ratings USING btree ("ratedWorkerId");


--
-- Name: ratings_taskId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ratings_taskId_idx" ON public.ratings USING btree ("taskId");


--
-- Name: ratings_workerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ratings_workerId_idx" ON public.ratings USING btree ("workerId");


--
-- Name: resumes_workerId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "resumes_workerId_key" ON public.resumes USING btree ("workerId");


--
-- Name: sessions_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX sessions_token_key ON public.sessions USING btree (token);


--
-- Name: system_config_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX system_config_key_key ON public.system_config USING btree (key);


--
-- Name: task_applications_taskId_workerId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "task_applications_taskId_workerId_key" ON public.task_applications USING btree ("taskId", "workerId");


--
-- Name: task_chats_taskId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "task_chats_taskId_key" ON public.task_chats USING btree ("taskId");


--
-- Name: task_submissions_applicationId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "task_submissions_applicationId_key" ON public.task_submissions USING btree ("applicationId");


--
-- Name: upi_mandates_mandateRef_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "upi_mandates_mandateRef_key" ON public.upi_mandates USING btree ("mandateRef");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_phone_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_phone_key ON public.users USING btree (phone);


--
-- Name: workers_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "workers_userId_key" ON public.workers USING btree ("userId");


--
-- Name: _CompletedBy _CompletedBy_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_CompletedBy"
    ADD CONSTRAINT "_CompletedBy_A_fkey" FOREIGN KEY ("A") REFERENCES public.bronze_tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _CompletedBy _CompletedBy_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_CompletedBy"
    ADD CONSTRAINT "_CompletedBy_B_fkey" FOREIGN KEY ("B") REFERENCES public.workers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: badge_history badge_history_workerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_history
    ADD CONSTRAINT "badge_history_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES public.workers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bronze_task_applications bronze_task_applications_bronzeTaskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bronze_task_applications
    ADD CONSTRAINT "bronze_task_applications_bronzeTaskId_fkey" FOREIGN KEY ("bronzeTaskId") REFERENCES public.bronze_tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bronze_task_applications bronze_task_applications_workerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bronze_task_applications
    ADD CONSTRAINT "bronze_task_applications_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES public.workers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bronze_tasks bronze_tasks_employerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bronze_tasks
    ADD CONSTRAINT "bronze_tasks_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES public.employers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_chatId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT "chat_messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES public.task_chats(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: community_memberships community_memberships_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_memberships
    ADD CONSTRAINT "community_memberships_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public.community_groups(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: community_memberships community_memberships_workerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.community_memberships
    ADD CONSTRAINT "community_memberships_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES public.workers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employers employers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employers
    ADD CONSTRAINT "employers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_employerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES public.employers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_mandateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_mandateId_fkey" FOREIGN KEY ("mandateId") REFERENCES public.upi_mandates(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.bronze_tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_workerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES public.workers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: quiz_results quiz_results_workerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_results
    ADD CONSTRAINT "quiz_results_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES public.workers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ratings ratings_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT "ratings_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public.task_applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ratings ratings_employerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT "ratings_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES public.employers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ratings ratings_ratedEmployerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT "ratings_ratedEmployerId_fkey" FOREIGN KEY ("ratedEmployerId") REFERENCES public.employers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ratings ratings_ratedWorkerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT "ratings_ratedWorkerId_fkey" FOREIGN KEY ("ratedWorkerId") REFERENCES public.workers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ratings ratings_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT "ratings_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.bronze_tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ratings ratings_workerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT "ratings_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES public.workers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: resumes resumes_workerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT "resumes_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES public.workers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_applications task_applications_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_applications
    ADD CONSTRAINT "task_applications_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.bronze_tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_applications task_applications_workerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_applications
    ADD CONSTRAINT "task_applications_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES public.workers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_attachments task_attachments_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT "task_attachments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.bronze_tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_chats task_chats_employerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_chats
    ADD CONSTRAINT "task_chats_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES public.employers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_chats task_chats_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_chats
    ADD CONSTRAINT "task_chats_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.bronze_tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_chats task_chats_workerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_chats
    ADD CONSTRAINT "task_chats_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES public.workers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_submission_files task_submission_files_submissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_submission_files
    ADD CONSTRAINT "task_submission_files_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES public.task_submissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_submissions task_submissions_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_submissions
    ADD CONSTRAINT "task_submissions_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public.bronze_task_applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_submissions task_submissions_previousVersionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_submissions
    ADD CONSTRAINT "task_submissions_previousVersionId_fkey" FOREIGN KEY ("previousVersionId") REFERENCES public.task_submissions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: task_submissions task_submissions_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_submissions
    ADD CONSTRAINT "task_submissions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.bronze_tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_submissions task_submissions_workerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_submissions
    ADD CONSTRAINT "task_submissions_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES public.workers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: trial_task_submissions trial_task_submissions_trialTaskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trial_task_submissions
    ADD CONSTRAINT "trial_task_submissions_trialTaskId_fkey" FOREIGN KEY ("trialTaskId") REFERENCES public.trial_tasks(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: trial_task_submissions trial_task_submissions_workerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trial_task_submissions
    ADD CONSTRAINT "trial_task_submissions_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES public.workers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: upi_mandates upi_mandates_employerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upi_mandates
    ADD CONSTRAINT "upi_mandates_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES public.employers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: workers workers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workers
    ADD CONSTRAINT "workers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

