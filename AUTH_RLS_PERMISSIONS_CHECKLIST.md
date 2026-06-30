# Auth, RLS, And Permissions Checklist

Current focus: harden authentication, invites, team roles, and authorization before bringing in outside customer organizations.

## Priority Fixes

### 1. Verify Pending Invite Before Creating Membership

**Status:** Done  
**Severity:** Critical  
**File:** `lib/auth/invitations.ts`

Current issue:
- Invite completion trusts `user.user_metadata.invited_organization_id` and `user.user_metadata.invited_role`.
- Membership is created before proving there is a valid pending invite row for the signed-in user's email.

Fix:
- On invite completion, query `organization_invites` first.
- Require:
  - `email = signed-in user's email`
  - `status = 'pending'`
  - `expires_at` is null or in the future
- Use the invite row's `organization_id` and `role`.
- Only then upsert `profiles` and `organization_members`.
- Mark the invite accepted after membership creation succeeds.

Implemented:
- `finalizeCurrentUserInvitation()` now looks up a real pending invite by signed-in email.
- Metadata is only used as an optional organization hint if multiple pending invites exist.
- The app now uses the invite row's `organization_id` and `role`, not user-controlled metadata, when creating membership.
- Expired invites are marked `expired` and do not create membership.

Why it matters:
- Prevents metadata-based org membership assignment.
- Makes invite acceptance trust the database, not user metadata.

### 2. Block Owner Assignment Through Normal Role Update

**Status:** Done  
**Severity:** High  
**File:** `app/api/team/members/[id]/route.ts`

Current issue:
- The API accepts `"owner"` as a valid role in the normal role-change endpoint.
- UI may hide owner, but a user could call the API directly.

Fix:
- Normal role update should allow only:
  - `admin`
  - `member`
  - `viewer`
- Ownership transfer should be a separate owner-only endpoint later.

Implemented:
- The API now has a separate editable-role list.
- Normal role updates reject `owner`.
- Existing owners can still exist in the database, but ownership cannot be assigned through the regular member role endpoint.

Why it matters:
- Prevents admins from promoting someone to owner through a direct API call.

### 3. Check Invite Tracking Insert Errors

**Status:** Done  
**Severity:** Medium  
**File:** `app/api/invitations/route.ts`

Current issue:
- Supabase Auth invite errors are checked.
- The insert into `organization_invites` is not checked.

Fix:
- Capture the insert result:
  - `const { error } = await admin.from("organization_invites").insert(...)`
- If it fails, return an error response.

Implemented:
- Invite creation now checks the `organization_invites` insert result.
- If the tracking row fails to save, the API returns an error instead of reporting success.

Why it matters:
- Avoids sending an auth invite without a matching workspace invite tracking row.

### 4. Confirm Invite Revoke Actually Updated A Row

**Status:** Done  
**Severity:** Medium  
**File:** `app/api/team/invites/[id]/route.ts`

Current issue:
- Revoke updates pending invite rows by id/org/status.
- It returns success even if no row was changed.

Fix:
- Use `.select("id").maybeSingle()` after update.
- If no row is returned, return a clear error such as:
  - invite not found
  - invite already accepted
  - invite already revoked

Implemented:
- Invite revoke now selects the updated row.
- If no pending invite was updated, the API returns `404` with a clear message.

Why it matters:
- Prevents silent success states in team management.

### 5. Define Role Permissions For App Actions

**Status:** In progress  
**Severity:** Medium  
**Files:** Multiple API routes

Current issue:
- Many app actions check only workspace membership.
- Not all actions check role-level permissions.

Decisions needed:
- Can `viewer` upload documents?
- Can `viewer` run AI analysis?
- Can `viewer` create notes?
- Can `member` delete documents?
- Can `member` invite users?
- Can `admin` remove members?
- Can `admin` delete deals?

Suggested MVP role model:
- `owner`: everything.
- `admin`: team management except ownership transfer, all deal/document actions.
- `member`: normal deal work, upload documents, run analysis, create notes.
- `viewer`: read-only access.

Implemented:
- Added `lib/auth/permissions.ts` as the shared app-level permission layer.
- Viewers are now blocked from core write/action API routes:
  - creating/updating deals
  - uploading/editing/deleting/extracting documents
  - running CIM analysis and financial extraction
  - building IC memos
  - importing revenue files and generating revenue views
  - creating/editing/deleting notes
  - generating call note intelligence
- Team management routes now use the shared permission layer, with owner-only admin management still enforced.

Still needed:
- Hide/disable the matching UI actions for viewers.
- Mirror these rules in Supabase RLS with role-aware SQL helpers.

Why it matters:
- Prevents read-only users from taking expensive or destructive actions.

### 6. Multi-Workspace Selection

**Status:** Later  
**Severity:** Low for MVP, Medium later  
**File:** `lib/auth/context.ts`

Current issue:
- The app selects the first workspace membership by `created_at`.
- This is fine if users only belong to one workspace.
- It is not enough if a user belongs to multiple orgs.

Fix later:
- Add selected workspace logic.
- Store selected org in session, URL, or user preference.

Why it matters:
- Needed for consultants, investors, or operators who belong to multiple workspaces.

## Already In Good Shape

- Most routes derive organization from the authenticated user context.
- Most database reads/writes include `organization_id`.
- Service-role routes usually perform explicit org checks.
- Invite creation does not allow inviting someone directly as owner.
- Members cannot remove themselves.
- Last-owner protection exists.

## Recommended Fix Order

1. Verify pending invite before creating membership.
2. Block `owner` assignment in normal role updates.
3. Check invite tracking insert errors.
4. Confirm invite revoke actually updated a row.
5. Add a role-permission matrix for expensive/destructive app actions.
6. Add multi-workspace selection later.
