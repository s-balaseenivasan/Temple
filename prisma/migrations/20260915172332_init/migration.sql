-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SuperAdmin', 'TempleAdmin');

-- CreateEnum
CREATE TYPE "AdminStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('draft', 'published', 'archived', 'cancelled');

-- CreateEnum
CREATE TYPE "ActiveInactive" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('pending', 'success', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "DonationType" AS ENUM ('cash_online', 'cash_offline', 'in_kind_goods', 'in_kind_land');

-- CreateEnum
CREATE TYPE "PaymentProviderName" AS ENUM ('razorpay', 'payu', 'cashfree', 'instamojo', 'mock');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('initiated', 'success', 'failed');

-- CreateEnum
CREATE TYPE "ContactEnquirerType" AS ENUM ('pangali', 'bhaktar');

-- CreateEnum
CREATE TYPE "ContactEnquiryStatus" AS ENUM ('new', 'responded', 'closed');

-- CreateEnum
CREATE TYPE "HistoryEntryStatus" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "MemberRequestType" AS ENUM ('registration', 'family_update', 'contact_update', 'matrimony_update');

-- CreateEnum
CREATE TYPE "MemberRequestStatus" AS ENUM ('new', 'in_review', 'completed', 'rejected');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('registration_info', 'bylaws', 'agm_report', 'annual_activity_report', 'public_notice');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('draft', 'published');

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL,
    "templeName_en" TEXT NOT NULL,
    "templeName_ta" TEXT,
    "addressLine_en" TEXT NOT NULL,
    "addressLine_ta" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "mapLatitude" DECIMAL(9,6),
    "mapLongitude" DECIMAL(9,6),
    "timingsJson" JSONB NOT NULL DEFAULT '{}',
    "socialLinksJson" JSONB,
    "is80GRegistered" BOOLEAN NOT NULL DEFAULT false,
    "registration80GNumber" TEXT,
    "activeLanguages" TEXT[] DEFAULT ARRAY['en', 'ta']::TEXT[],
    "historyIntro_en" TEXT NOT NULL DEFAULT '',
    "historyIntro_ta" TEXT,
    "adminStructureNote_en" TEXT NOT NULL DEFAULT '',
    "adminStructureNote_ta" TEXT,
    "bhakthaSabhaIntro_en" TEXT NOT NULL DEFAULT '',
    "bhakthaSabhaIntro_ta" TEXT,
    "transparencyNote_en" TEXT NOT NULL DEFAULT '',
    "transparencyNote_ta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL,
    "status" "AdminStatus" NOT NULL DEFAULT 'active',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designations" (
    "id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ta" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "designations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committee_members" (
    "id" TEXT NOT NULL,
    "photo" TEXT,
    "name_en" TEXT NOT NULL,
    "name_ta" TEXT,
    "designationId" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "publicMobileVisible" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT,
    "bio_en" TEXT,
    "bio_ta" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ActiveInactive" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "committee_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news" (
    "id" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "title_ta" TEXT,
    "body_en" TEXT NOT NULL,
    "body_ta" TEXT,
    "featuredImage" TEXT,
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "category" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_categories" (
    "id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ta" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ta" TEXT,
    "description_en" TEXT,
    "description_ta" TEXT,
    "eventDate" DATE NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "categoryId" TEXT NOT NULL,
    "posterImage" TEXT,
    "location_en" TEXT,
    "location_ta" TEXT,
    "specialInstructions_en" TEXT,
    "specialInstructions_ta" TEXT,
    "contactPersonName" TEXT,
    "contactNumber" TEXT,
    "registrationRequired" BOOLEAN NOT NULL DEFAULT false,
    "status" "EventStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_albums" (
    "id" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "title_ta" TEXT,
    "category" TEXT,
    "coverImage" TEXT,
    "date" DATE,
    "description_en" TEXT,
    "description_ta" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_photos" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption_en" TEXT,
    "caption_ta" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "title_ta" TEXT,
    "videoUrl" TEXT NOT NULL,
    "thumbnail" TEXT,
    "description_en" TEXT,
    "description_ta" TEXT,
    "category" TEXT,
    "publishedAt" TIMESTAMP(3),
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_purposes" (
    "id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ta" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donation_purposes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "donorName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "pan" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "purposeId" TEXT NOT NULL,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" "DonationStatus" NOT NULL DEFAULT 'pending',
    "donationType" "DonationType" NOT NULL DEFAULT 'cash_online',
    "valuationNote" TEXT,
    "recordedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "donationId" TEXT NOT NULL,
    "provider" "PaymentProviderName" NOT NULL,
    "providerOrderId" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "providerSignature" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rawWebhookPayload" JSONB,
    "status" "PaymentStatus" NOT NULL DEFAULT 'initiated',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL,
    "donationId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuedByAdminId" TEXT,
    "pdfUrl" TEXT,
    "includes80GClause" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_counters" (
    "fy" INTEGER NOT NULL,
    "lastSeq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "receipt_counters_pkey" PRIMARY KEY ("fy")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_enquiries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "enquirerType" "ContactEnquirerType" NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactEnquiryStatus" NOT NULL DEFAULT 'new',
    "handledByAdminId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "history_timeline_entries" (
    "id" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "title_ta" TEXT,
    "description_en" TEXT,
    "description_ta" TEXT,
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "status" "HistoryEntryStatus" NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "history_timeline_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deities" (
    "id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ta" TEXT,
    "description_en" TEXT,
    "description_ta" TEXT,
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ActiveInactive" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "festival_traditions" (
    "id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ta" TEXT,
    "description_en" TEXT,
    "description_ta" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ActiveInactive" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "festival_traditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "welfare_programs" (
    "id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ta" TEXT,
    "description_en" TEXT,
    "description_ta" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ActiveInactive" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "welfare_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_requests" (
    "id" TEXT NOT NULL,
    "requestType" "MemberRequestType" NOT NULL,
    "pangaliName" TEXT NOT NULL,
    "familyRepresentativeName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "lineageBranch" TEXT,
    "details" TEXT NOT NULL,
    "status" "MemberRequestStatus" NOT NULL DEFAULT 'new',
    "handledByAdminId" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "title_ta" TEXT,
    "category" "DocumentCategory" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "publishedDate" DATE NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'draft',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "admin_users_email_idx" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "designations_name_en_key" ON "designations"("name_en");

-- CreateIndex
CREATE INDEX "committee_members_designationId_idx" ON "committee_members"("designationId");

-- CreateIndex
CREATE INDEX "news_status_publishedAt_idx" ON "news"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "news_authorId_idx" ON "news"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "event_categories_name_en_key" ON "event_categories"("name_en");

-- CreateIndex
CREATE INDEX "events_eventDate_idx" ON "events"("eventDate");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "events_categoryId_idx" ON "events"("categoryId");

-- CreateIndex
CREATE INDEX "gallery_photos_albumId_idx" ON "gallery_photos"("albumId");

-- CreateIndex
CREATE INDEX "videos_status_idx" ON "videos"("status");

-- CreateIndex
CREATE UNIQUE INDEX "donation_purposes_name_en_key" ON "donation_purposes"("name_en");

-- CreateIndex
CREATE INDEX "donations_mobile_idx" ON "donations"("mobile");

-- CreateIndex
CREATE INDEX "donations_createdAt_idx" ON "donations"("createdAt");

-- CreateIndex
CREATE INDEX "donations_status_idx" ON "donations"("status");

-- CreateIndex
CREATE INDEX "payments_donationId_idx" ON "payments"("donationId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_providerOrderId_key" ON "payments"("provider", "providerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_donationId_key" ON "receipts"("donationId");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_receiptNumber_key" ON "receipts"("receiptNumber");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_createdAt_idx" ON "audit_logs"("entityType", "entityId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "contact_enquiries_status_createdAt_idx" ON "contact_enquiries"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "member_requests_status_createdAt_idx" ON "member_requests"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "member_requests_mobile_idx" ON "member_requests"("mobile");

-- CreateIndex
CREATE INDEX "documents_category_status_idx" ON "documents"("category", "status");

-- AddForeignKey
ALTER TABLE "committee_members" ADD CONSTRAINT "committee_members_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "designations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "event_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_photos" ADD CONSTRAINT "gallery_photos_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "gallery_albums"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_purposeId_fkey" FOREIGN KEY ("purposeId") REFERENCES "donation_purposes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_recordedByAdminId_fkey" FOREIGN KEY ("recordedByAdminId") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "donations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "donations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_issuedByAdminId_fkey" FOREIGN KEY ("issuedByAdminId") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_enquiries" ADD CONSTRAINT "contact_enquiries_handledByAdminId_fkey" FOREIGN KEY ("handledByAdminId") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_requests" ADD CONSTRAINT "member_requests_handledByAdminId_fkey" FOREIGN KEY ("handledByAdminId") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
