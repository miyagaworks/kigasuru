-- Enable Row Level Security on all tables
-- This migration enables RLS to prevent direct PostgREST access
-- All data access should go through the application's API routes (via Prisma)

-- Authentication tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailVerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PendingRegistration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;

-- App-specific tables
ALTER TABLE "Shot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CancellationRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailCampaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserSettings" ENABLE ROW LEVEL SECURITY;

-- Security tables
ALTER TABLE "LoginAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoginEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IpBlacklist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IpWhitelist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CountryRestriction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WebAuthnCredential" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WebAuthnChallenge" ENABLE ROW LEVEL SECURITY;

-- Prisma internal tables
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- Note: By enabling RLS without creating any policies,
-- PostgREST access (anon/authenticated roles) will be blocked.
-- Prisma uses the direct database connection (service_role or DATABASE_URL)
-- which bypasses RLS, so your application will continue to work normally.
