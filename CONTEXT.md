# Campaign Test Console (CTC) -- Project Context

> This file preserves all codebase knowledge, architecture decisions, and API contracts
> for future development sessions. Read this before making changes.

## 1. Project Purpose

CTC is a **standalone React app** that verifies backend API wiring for the Engage campaign platform.
When the product launches in QA, this console confirms all API endpoints (called by `engage-frontend`)
are reachable, return correct response shapes, and support full end-to-end campaign flows for
**SMS** and **WhatsApp** channels.

It is NOT a UI testing tool -- it calls the same REST APIs that `engage-frontend` calls directly.

## 2. Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **Standalone app** (not inside engage-frontend) | Decoupled from product release cycle; can be deployed independently to any QA environment |
| **React 19 + Vite + TypeScript** | Matches engage-frontend stack for developer familiarity |
| **MUI v5** | Engage product uses Signal Design System (wraps MUI); using MUI directly avoids the private npm dependency |
| **Native `fetch`** (not Axios) | engage-frontend uses `fetch` via `apiClient`; we mirror the same patterns |
| **Zustand** (not Redux) | Simpler for a tool app; persists config to localStorage automatically |
| **Channel registry pattern** (`types/channels.ts`) | Adding a new channel = add to array + implement API/flow modules |
| **Hardcoded auth v1** | Simple local login; iamix SSO stubbed for v2 |

## 3. Tech Stack

- React 19, TypeScript, Vite 6
- MUI v5 (material, icons, x-data-grid)
- Zustand 5 (state + localStorage persistence)
- @tanstack/react-query 5
- xlsx (SheetJS) for CSV/XLSX parsing
- zod for response validation schemas
- recharts for results visualization

## 4. Complete API Inventory

All paths are relative to `{apiBaseUrl}`. Account-scoped paths use `v1/accounts/{accountSid}/...`.

### 4.1 Config / Auth (2 endpoints)

| # | Name | Method | Path | Source |
|---|------|--------|------|--------|
| 1 | Config | GET | `/v1/config` | `engage-frontend/src/api/configApi.ts` |
| 2 | Session Validate | GET | `/v1/auth/validate-session` | `engage-frontend/src/api/authApi.ts` |

### 4.2 SMS (10 endpoints)

| # | Name | Method | Path | Source |
|---|------|--------|------|--------|
| 3 | SMS Templates | GET | `.../templates/sms` | `smsTemplatesApi.ts` |
| 4 | SMS DLT Entities | GET | `.../sms/dlt-entities` | `smsDltEntitiesApi.ts` |
| 5 | SMS Sender IDs | GET | `.../sms/sender-id-entity-maps` | `smsSenderIdEntityMapsApi.ts` |
| 6 | SMS Campaign List | GET | `.../message-campaigns?channel=sms` | `smsCampaignsApi.ts` |
| 7 | SMS Campaign Detail | GET | `.../message-campaigns/:id?channel=sms` | `smsCampaignsApi.ts` |
| 8 | SMS Send Test | POST | `.../templates/sms/test` | `smsTestSmsApi.ts` |
| 9 | SMS Test Status | GET | `.../templates/sms/messages/:sid` | `smsTestSmsApi.ts` |
| 10 | SMS Create Campaign | POST | `.../message-campaigns` | `smsCampaignsApi.ts` |
| 11 | SMS Message Details | GET | `.../message-campaigns/:id/message-details?channel=sms` | `smsCampaignsApi.ts` |
| 12 | SMS CSV Upload | POST | `.../contacts/csv-upload` | `smsCampaignsApi.ts` |

### 4.3 WhatsApp (10 endpoints)

| # | Name | Method | Path | Source |
|---|------|--------|------|--------|
| 13 | WA WABAs | GET | `.../wabas` | `whatsappDetailsApi.ts` |
| 14 | WA Numbers | GET | `.../wabas/numbers?wabaId=...` | `whatsappDetailsApi.ts` |
| 15 | WA Templates | GET | `.../templates/whatsapp?wabaId=...` | `whatsAppTemplatesApi.ts` |
| 16 | WA Template By ID | GET | `.../templates/whatsapp/:id?wabaId=...` | `whatsAppTemplatesApi.ts` |
| 17 | WA Media Upload | POST | `.../templates/whatsapp/template-media-upload` | `whatsAppTemplatesApi.ts` |
| 18 | WA Send Test | POST | `.../messages/whatsapp` | `whatsappDetailsApi.ts` |
| 19 | WA Campaign List | GET | `.../message-campaigns?channel=whatsapp` | `whatsappCampaignsApi.ts` |
| 20 | WA Campaign Detail | GET | `.../message-campaigns/:id?channel=whatsapp` | `whatsappCampaignsApi.ts` |
| 21 | WA Create Campaign | POST | `.../message-campaigns` | `whatsappCampaignsApi.ts` |
| 22 | WA Dynamic Headers | GET | `.../contacts/csv-upload/:id?type=dynamic` | `whatsappDetailsApi.ts` |

### 4.4 Lists & Contacts (7 endpoints)

| # | Name | Method | Path | Source |
|---|------|--------|------|--------|
| 23 | Lists | GET | `.../lists` | `accountListsApi.ts` |
| 24 | Create Static List | POST | `.../lists` | `accountListsApi.ts` |
| 25 | CSV Upload | POST | `.../contacts/csv-upload` | `accountListsApi.ts` |
| 26 | Contacts | GET | `.../contacts` | `contactsApi.ts` |
| 27 | Create Contact | POST | `.../contacts` | `contactsApi.ts` |
| 28 | Delete Contact | DELETE | `.../contacts/:sid` | `contactsApi.ts` |
| 29 | Add to List | POST | `.../lists/:id/contacts` | `contactsApi.ts` |

### 4.5 Call Campaign -- FUTURE (via Twilix proxy)

| Name | Method | Path |
|------|--------|------|
| List Campaigns | GET | `/api/proxy/twilix/campaigns` |
| Campaign Detail | GET | `/api/proxy/twilix/campaigns/:id` |
| Create Campaign | POST | `/api/proxy/twilix/campaigns` |
| Update Campaign | PUT | `/api/proxy/twilix/campaigns/:id` |
| Call Details | GET | `/api/proxy/twilix/campaigns/:id/call-details` |
| Get Throttle | GET | `/api/proxy/twilix/campaigns/throttle` |
| Set Throttle | PUT | `/api/proxy/twilix/campaigns/throttle` |
| Associate Templates | CRUD | `/api/proxy/twilix/campaigns/associate-templates` |
| CSV Upload | POST | `/api/proxy/twilix/contacts/csv-upload` |
| CSV Status | GET | `/api/proxy/twilix/csv-status/:uploadId` |

**Create payload**: callerId, contentType (readText/selectFlow/createIvr), messageText/audioFileUrl/flowId/ivrId, audienceType, contactListIds, schedule, retries, throttle, callType.

### 4.6 OB Dialer -- FUTURE (via Apix proxy)

| Name | Method | Path |
|------|--------|------|
| List Campaigns | GET | `/api/proxy/apix/auto-dialers` |
| Detail | GET | `/api/proxy/apix/auto-dialers/:id` |
| Create | POST | `/api/proxy/apix/auto-dialers` |
| Update Status | PUT | `/api/proxy/apix/auto-dialers/:id` |
| Call Details | GET | `/api/proxy/apix/auto-dialers/:id/call-details` |
| Active Calls | GET | `/api/proxy/apix/auto-dialers/:id/active-calls` |
| Lists | GET | `/api/proxy/apix/auto-dialers/lists` |
| Groups | GET | `/api/proxy/apix/auto-dialers/groups` |
| Agents | GET | `/api/proxy/apix/auto-dialers/agents` |
| Caller IDs | GET | `/api/proxy/apix/auto-dialers/caller-ids` |

**Create payload**: name, caller_id, list_ids/dial_whom_url, group_id/agent_id, start_date, start_time, number_of_retries, retry_statuses, call_type.

### 4.7 RCS -- FUTURE (Twilix proxy + Engage API)

| Name | Method | Path |
|------|--------|------|
| RCS Bots | GET | `/api/proxy/twilix/rcs-bots` |
| Bot Templates | GET | `/api/proxy/twilix/rcs-agents/:botId/templates?channel=rcs` |
| Campaign Detail | GET | `.../message-campaigns/:id?channel=rcs` |
| Create Campaign | POST | `.../message-campaigns` (channel=rcs) |
| Update Status | PUT | `.../message-campaigns/:id` (channel=rcs) |

**Create payload**: channel=rcs, name, botId, templateName, components, listId, schedule, fallback (primary/secondary/smsContent/whatsappTemplateId).

## 5. Authentication Inventory

### v1: Local Auth (Current)
- Username: `admin`, Password: `password`
- Stored in Zustand `ctc-auth` localStorage key
- `ProtectedRoute` checks `isAuthenticated` flag

### v2: iamix SSO (Future -- Disabled)

**iamix** is a Go service (Echo v4) coordinating IAM with Auth0.

**Auth flow:**
1. Redirect to `{iamixBaseUrl}/auth/sso` with application query param
2. iamix resolves tenant -> redirects to Auth0 org-scoped login
3. Auth0 handles login (username/password, Google Workspace SSO, Azure AD SSO)
4. Callback returns JWT access token
5. Validate with `GET /v1/auth/validate-session` (engage-backend)

**Key iamix endpoints:**
- `POST /v2/auth0/users/:email/verification-requests` -- validate credentials (email is base64-encoded in path)
- `GET /v2/auth0/users/:email/profile` -- user profile
- `DELETE /v2/auth0/users/:email/sessions` -- revoke sessions across apps
- `CRUD /v2/sso_tenants/:accountSid` -- SSO tenant management
- `POST /v2/connections` -- create enterprise connections (Google/Azure)
- `GET /logout` -- Auth0 logout redirect

**iamix config required:**
- Auth0 issuer URL (JWKS endpoint for JWT validation)
- Auth0 audience (`iam-api`)
- Auth0 client ID (register CTC as an application)
- iamix base URL

**Source files:** `iamix/cmd/http/routes.go`, `iamix/cmd/http/middlewares/auth.go`, `iamix/internal/services/auth0.go`, `iamix/pkg/contracts/user_profile.go`

## 6. Codebase Map

### engage-frontend (React 19 + Vite + Signal DS)
**Path:** `/Users/apoorv.saxena/Desktop/Cursor Work/engage-frontend`

| Area | Location |
|------|----------|
| API client | `src/api/client.ts` (fetch wrapper, credentials: include) |
| Account paths | `src/api/accountScopedPaths.ts` |
| Response unwrapping | `src/api/unwrapEngageApi.ts` |
| SMS APIs | `src/features/campaigns/channels/sms/api/` |
| WhatsApp APIs | `src/features/campaigns/channels/whatsapp/api/` |
| Call APIs | `src/features/campaigns/channels/call/api/` |
| Dialer APIs | `src/features/campaigns/channels/dialer/api/` |
| RCS APIs | `src/features/campaigns/channels/rcs/api/` |
| Lists | `src/api/accountListsApi.ts` |
| Contacts | `src/features/contacts/api/contactsApi.ts` |
| Auth | `src/auth/IamAuthGate.tsx`, `src/api/authApi.ts` |
| Config | `src/config/env.ts` |

### campaignix (Go backend)
**Path:** `/Users/apoorv.saxena/Desktop/Cursor Work/campaignix`

| Area | Location |
|------|----------|
| Campaign contracts | `pkg/contracts/campaign.go`, `campaign_create.go` |
| API routes | `cmd/http/routes.go` (all under /v2) |
| Variable mapping | `internal/scheduler/queue/job/resolve_contacts.go` (`@@header` substitution) |
| Lists (Addressbook) | `internal/helpers/lists.go` |
| SMS (Twilix) | `internal/helpers/twilix.go` |

### cleopatra (older React 16 + Ant Design frontend)
**Path:** `/Users/apoorv.saxena/Desktop/Cursor Work/cleopatra`

Legacy frontend for campaigns. SMS/WhatsApp/Call/Dialer/RCS flows exist here. engage-frontend is the replacement.

### iamix (Go IAM service)
**Path:** `/Users/apoorv.saxena/Desktop/Cursor Work/iamix`

| Area | Location |
|------|----------|
| Routes | `cmd/http/routes.go` |
| JWT middleware | `cmd/http/middlewares/auth.go` |
| Auth0 service | `internal/services/auth0.go` |
| SSO tenants | Handlers in `cmd/http/handlers/` |
| User profile | `pkg/contracts/user_profile.go` |
| Config | `configs/config.local.json` |

## 7. Backend Service Map

| Frontend API Path | Backend Service |
|-------------------|----------------|
| `/v1/config`, `/v1/auth/*` | Engage Backend (Node.js) |
| `v1/accounts/:sid/message-campaigns*` | Engage Backend -> Campaignix / Hedwig |
| `v1/accounts/:sid/templates/sms*` | Engage Backend -> Twilix |
| `v1/accounts/:sid/templates/whatsapp*` | Engage Backend -> Hedwig |
| `v1/accounts/:sid/wabas*` | Engage Backend -> Hedwig |
| `v1/accounts/:sid/messages/whatsapp` | Engage Backend -> Hedwig |
| `v1/accounts/:sid/lists*` | Engage Backend -> Addressbook |
| `v1/accounts/:sid/contacts*` | Engage Backend -> Addressbook |
| `v1/accounts/:sid/sms/*` | Engage Backend -> Twilix |
| `/api/proxy/twilix/*` | Vite/Nginx proxy -> Twilix (Call campaigns) |
| `/api/proxy/apix/*` | Vite/Nginx proxy -> Apix (Dialer campaigns) |

## 8. Channel Implementation Status

| Channel | Status | CTC Module |
|---------|--------|------------|
| SMS | **Done** | `api/smsApi.ts`, health checks, E2E flow |
| WhatsApp | **Done** | `api/whatsappApi.ts`, health checks, E2E flow |
| Call | **Planned** | Sidebar entry (disabled), API types stubbed |
| OB Dialer | **Planned** | Sidebar entry (disabled), API types stubbed |
| RCS | **Planned** | Sidebar entry (disabled), API types stubbed |

## 9. Auth Implementation Status

| Auth Method | Status | Module |
|-------------|--------|--------|
| Local (admin/password) | **Done** | `auth/authStore.ts`, `auth/LoginPage.tsx` |
| iamix SSO (Auth0) | **Planned** | `auth/iamixAuth.ts` (stubbed) |

## 10. Extension Guide

### Adding a New Channel

1. **Define API module**: Create `src/api/{channel}Api.ts` following the pattern of `smsApi.ts`
2. **Add health check definitions**: In `src/hooks/useHealthCheck.ts`, add entries to `buildCheckDefs()`
3. **Create E2E flow**: Add a flow component in `src/components/execution/{Channel}E2EFlow.tsx`
4. **Add config panel**: Create `src/components/config/{Channel}ConfigPanel.tsx`
5. **Enable in sidebar**: In `src/types/channels.ts`, set `enabled: true` for the channel
6. **Add tab in ExecutionPage**: Add a new `<Tab>` and flow runner function

### Enabling SSO

1. Register CTC as an Auth0 application in iamix
2. Set environment variables: `VITE_IAMIX_BASE_URL`, `VITE_AUTH0_AUDIENCE`, `VITE_AUTH0_CLIENT_ID`
3. Implement `initiateSSOLogin()` in `auth/iamixAuth.ts`: redirect to `{iamixBaseUrl}/auth/sso?application={clientId}`
4. Implement callback handler: exchange Auth0 code for JWT
5. Store JWT and use it in `api/client.ts` Authorization header
6. Update `ProtectedRoute` to validate JWT expiry
7. Set `SSO_ENABLED = true` in `auth/iamixAuth.ts`

## 11. Known Quirks

1. **Response envelopes vary**: Engage backend wraps responses as `{ data: T }`, `{ response: T }`, `{ data: { response: T } }`, or flat. The `unwrap.ts` module handles all variants.
2. **Two WABA stacks**: engage-frontend has both `whatsappDetailsApi.ts` (Engage `v1/accounts/.../wabas`) and `wabasApi.ts` (Twilix proxy `/api/proxy/twilix/wabas`). The create wizard uses the Engage paths.
3. **SMS content_type naming**: `"text"` = static campaign, `"unicode"` = dynamic campaign (CSV upload). This is counter-intuitive but matches the backend contract.
4. **SMS variable placeholders**: SMS uses `%s`/`%d` printf-style; WhatsApp uses `{{1}}`, `{{2}}` positional; Voice (campaignix) uses `@@columnName` from CSV headers.
5. **iamix email encoding**: User email in iamix API paths must be **base64-encoded** (e.g., `/v2/auth0/users/YWRtaW5AZXhhbXBsZS5jb20=/profile`).
6. **Call/Dialer use different proxy paths**: Call goes through `/api/proxy/twilix/campaigns`, Dialer through `/api/proxy/apix/auto-dialers`. These are not under the `v1/accounts` prefix.
7. **RCS uses both backends**: Bot/template APIs go through Twilix proxy, but campaign CRUD uses the Engage `v1/accounts/.../message-campaigns?channel=rcs` path.

## 12. Test Case CSV Format

### Standard format (from existing UAT CSVs):
```
Test_Case_ID, Category, Sub_Category, Priority, Test_Type, Pre_Conditions,
Test_Steps, Expected_Result, Actual_Result, Status, Tested_By, Test_Date,
Comments, Mapped_Jira_Cards
```

### Extended format (for automated execution):
```
(standard columns), Channel, Campaign_Type, Template_ID, List_IDs,
Variable_Mapping, Test_Numbers, Expected_Status
```

The parser (`utils/csvParser.ts`) normalizes headers case-insensitively and maps both formats.

## 13. File Structure Quick Reference

```
campaign-test-console/
  CONTEXT.md              <- THIS FILE
  package.json
  vite.config.ts
  tsconfig.json
  index.html
  .env.example
  src/
    main.tsx              # React root with providers
    App.tsx               # Route definitions
    theme.ts              # MUI dark theme
    types/
      config.ts           # AppConfig, SmsConfig, WhatsAppConfig
      channels.ts         # ChannelDefinition, CHANNELS array
      testCase.ts         # TestCase, TestResult, TestRun
      api.ts              # EndpointCheck, zod response schemas
    api/
      client.ts           # fetch wrapper (mirrors engage-frontend apiClient)
      paths.ts            # Account-scoped path builders
      unwrap.ts           # Response envelope unwrappers
      configApi.ts        # GET /v1/config, validate-session
      smsApi.ts           # 10 SMS endpoints
      whatsappApi.ts      # 10 WhatsApp endpoints
      listApi.ts          # List CRUD + CSV upload
      contactApi.ts       # Contact CRUD
    auth/
      authStore.ts        # Zustand: isAuthenticated, login/logout
      LoginPage.tsx       # Login form + disabled SSO button
      ProtectedRoute.tsx  # Route guard
      iamixAuth.ts        # STUBBED: Auth0/iamix SSO types + functions
    store/
      configStore.ts      # API URL, accountSid, auth mode, test phones, SMS/WA config
      healthCheckStore.ts # Wiring check results
      testCaseStore.ts    # Uploaded test cases and run history
    hooks/
      useHealthCheck.ts   # Health check execution logic (16 endpoint checks)
    utils/
      csvParser.ts        # CSV/XLSX -> TestCase[] parser
    components/
      layout/
        AppLayout.tsx     # Sidebar + main content Outlet
        Sidebar.tsx       # Navigation with channel entries (3 disabled)
        PageHeader.tsx    # Reusable page title bar
      health/
        WiringHealthGrid.tsx  # Health check DataGrid with expandable rows
        ResponseInspector.tsx # JSON viewer for request/response
      execution/
        FlowStepCard.tsx  # Single E2E step card with status
    pages/
      HealthCheckPage.tsx   # Wiring health check (home page)
      ConfigPage.tsx        # Configuration panels
      TestCasesPage.tsx     # CSV/XLSX upload + test case table
      ExecutionPage.tsx     # SMS/WhatsApp E2E flow runner
      ResultsPage.tsx       # Charts, summary, CSV export
```
