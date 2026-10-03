-- Tenant invite reminders: the hourly runner (utils/tenantInviteRunner.js)
-- emails a reminder a week before an invite expires and records it here.
-- Expiry and the month-to-month roll-forward need no new columns.

-- AlterTable
ALTER TABLE "TenantInvite" ADD COLUMN     "reminderSentAt" TIMESTAMP(3);
