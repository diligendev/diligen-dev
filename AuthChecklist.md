# Auth Checklist

## Completed

- [x] Installed Supabase SDK packages.
- [x] Added Supabase browser/server clients.
- [x] Added server-only Supabase admin client using the service role key.
- [x] Added environment variable validation for Supabase URL and publishable key.
- [x] Protected app routes from unauthenticated users.
- [x] Added login page with email/password sign-in.
- [x] Added sign out from the app sidebar.
- [x] Added safe redirect handling for login/auth redirects.
- [x] Added `/setup` screen for signed-in users without a workspace.
- [x] Added org/workspace context lookup from Supabase.
- [x] Reconnected app layout to require a workspace membership.
- [x] Reconnected sidebar to real user/org/role context.
- [x] Reconnected settings to real user/org/role context.
- [x] Added `organization_invites` SQL setup file.
- [x] Added owner/admin invite flow from Settings -> Team.
- [x] Added pending invites table in Settings -> Team.
- [x] Added real workspace members table in Settings -> Team.
- [x] Added invite completion endpoint.
- [x] Added Supabase invite hash-token handler.
- [x] Added dedicated `/auth/confirm` invite landing page.
- [x] Updated new invites to land on `/auth/confirm`.
- [x] Added automatic profile + membership creation after invite acceptance.
- [x] Added `/set-password` page for invited users.
- [x] Added password reset request page.
- [x] Added password reset completion page.
- [x] Added revoke pending invite action.
- [x] Added member role update action.
- [x] Added remove member backend action.
- [x] Blocked users from changing their own workspace role.
- [x] Blocked users from removing themselves.
- [x] Blocked demoting/removing the last owner.
- [x] Added audit events for invite/member actions.
- [x] Confirmed `npm run lint` passes.
- [x] Confirmed `npx tsc --noEmit` passes.
- [x] Confirmed `npm run build` passes.

## Needs Manual Supabase Verification

- [ ] Confirm `supabase-auth-onboarding.sql` has been run in Supabase.
- [ ] Confirm Auth Site URL is `http://localhost:3000`.
- [ ] Confirm Redirect URLs include `http://localhost:3000/**`.
- [ ] Send one fresh invite after rate limit resets.
- [ ] Confirm new invite lands on `/auth/confirm`.
- [ ] Confirm invited user is sent to `/set-password`.
- [ ] Confirm invited user can set password and reach `/dashboard`.
- [ ] Confirm pending invite becomes accepted after completion.
- [ ] Confirm accepted user appears in Team members.

## Remaining Auth Work

- [ ] Add a proper transfer ownership flow.
- [ ] Add real remove-member UI or decide whether removal should stay hidden behind ownership transfer rules.
- [ ] Add resend invite flow with rate-limit-aware messaging.
- [ ] Add cleanup flow for revoked test invites and unactivated auth users.
- [ ] Add expired invite messaging.
- [ ] Add expired reset-password messaging.
- [ ] Add email verification polish.
- [ ] Add role-based UI permissions throughout the app.
- [ ] Add database RLS for future app tables: deals, documents, analyses, files, notes, billing.
- [ ] Add session timeout policy.
- [ ] Add login rate limiting.
- [ ] Add MFA support.
- [ ] Add production SMTP for branded auth emails.
- [ ] Add production domain redirect URLs.
- [ ] Add audit log viewer for admins.
- [ ] Add tests for auth redirects, invite acceptance, role changes, and workspace access.

## Current Testing Rule

For local invite testing, use one clean test email at a time:

1. Delete failed test user from Supabase Auth Users.
2. Revoke or delete old pending invite row.
3. Send one fresh invite.
4. Open the newest invite email in incognito.
5. Complete `/auth/confirm` -> `/set-password` -> `/dashboard`.

