# Horizon AI — Authentication & Identity Architecture

> **Context:** Horizon AI stores the most sensitive data a person can give an app — their
> private reflections, moods, relationships, fears, and goals over months. Authentication
> here is not a checkbox. It is a **core feature and a core selling point**: *"your memory
> is yours — private, encrypted, and impossible for us to read casually."* This document
> specifies the identity, session, and data-protection architecture.

---

## 1. Design principles

1. **Passwordless-first.** Passwords are the #1 breach vector and add friction. We use
   passkeys (WebAuthn) and social login as primary; magic links as universal fallback.
2. **Least privilege on user data.** Every row of memory is bound to a `user_id`, enforced
   at the database layer (Postgres Row-Level Security), not just in application code.
3. **Encryption is a product feature.** Sensitive memory content is encrypted with
   per-user data keys (envelope encryption). Even a full DB dump should not reveal a
   user's private reflections in plaintext.
4. **Defense in depth.** Short-lived access tokens + rotating refresh tokens + device
   binding + anomaly detection. A single stolen token should have a small blast radius.
5. **Right to leave.** One-click export and hard delete. This is legally required (GDPR /
   CCPA) *and* a trust differentiator for a journaling product.

---

## 2. Build vs. buy

For a consumer app moving fast, **do not hand-roll password hashing, session tables, and
OAuth flows.** Use a managed identity provider for the auth *mechanics*, and keep the
*authorization* and *data encryption* in your own control.

| Option | Verdict | Why |
|---|---|---|
| **Clerk** | ✅ Recommended for launch | Best-in-class passkeys + social + magic link, drop-in Next.js SDK, device/session management, generous free tier. Fastest path to a secure launch. |
| **Supabase Auth** | ✅ Strong alternative | If you also use Supabase Postgres, RLS + auth integrate natively. Slightly more DIY. |
| **Auth0 / WorkOS** | ⚠️ Later | Enterprise-grade but heavier/pricier; overkill for a B2C launch. Revisit if you add B2B. |
| **Roll your own** | ❌ Avoid | You'll spend weeks on token rotation, OAuth edge cases, and breach liability. Not your moat. |

**Recommendation:** Launch on **Clerk** for identity + sessions. Keep **your own Postgres**
as the source of truth for user data, and mirror Clerk's `user_id` as the tenant key.
This gives you speed now and portability later (you can migrate off Clerk because *your*
data lives in *your* database).

---

## 3. Authentication methods (advanced)

### 3.1 Passkeys (WebAuthn) — primary
- Phishing-resistant, no shared secret, backed by device biometrics (Face ID / fingerprint).
- Uses the platform authenticator; private key never leaves the device.
- Fallback to a second passkey or magic link if the user changes devices.

### 3.2 Social login — Google & Apple
- Lowest friction for consumer onboarding. **Apple Sign-In is mandatory** if you ship on iOS.
- We only request `email` + `name` scopes. No contact/calendar scraping — trust matters here.

### 3.3 Magic links (email OTP) — universal fallback
- Single-use, 10-minute TTL, one-time token stored hashed in Redis (`magiclink:{hash}`).
- Rate-limited per email + per IP to prevent enumeration and spam.

### 3.4 Step-up MFA (TOTP) — for sensitive actions
- Optional TOTP (authenticator app) that we **require** for high-risk operations:
  exporting the full memory archive, deleting the account, or disabling encryption.
- This means even a hijacked session can't exfiltrate a user's entire life without a
  second factor.

---

## 4. Session & token architecture

```
┌──────────────┐   passkey / oauth / magic link    ┌──────────────────┐
│  Next.js UI  │ ────────────────────────────────▶ │  Clerk (IdP)     │
└──────┬───────┘                                    └────────┬─────────┘
       │  httpOnly, Secure, SameSite=Lax cookie              │  signs JWT
       │  (access token, 15 min)                             │  (RS256)
       ▼                                                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│  FastAPI backend                                                       │
│   • verify JWT signature against Clerk JWKS (cached)                   │
│   • extract user_id → set Postgres session variable app.user_id       │
│   • RLS restricts every query to that user's rows                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Token policy
| Token | Lifetime | Storage | Rotation |
|---|---|---|---|
| Access (JWT, RS256) | 15 min | `httpOnly` `Secure` `SameSite=Lax` cookie | Re-minted from refresh |
| Refresh | 30 days | httpOnly cookie, one-time-use | **Rotated on every use**; reuse of an old refresh token = token theft → revoke the whole family |
| WebSocket/SSE ticket | 60 s | in-memory, single-use | Issued per streaming connection so the long-lived chat socket never carries the raw session |

- **Refresh token rotation with reuse detection** is the key defense: if a leaked refresh
  token is replayed, the entire session family is invalidated and the user is forced to
  re-authenticate.
- **Never store tokens in `localStorage`.** httpOnly cookies only, to neutralize XSS token theft.

---

## 5. Authorization: per-user isolation with Postgres RLS

Application-layer `WHERE user_id = ?` checks are not enough — one missed filter leaks
another person's diary. Enforce isolation at the database:

```sql
-- Every memory table carries user_id
ALTER TABLE semantic_facts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedural_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_embeddings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages        ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON semantic_facts
  USING (user_id = current_setting('app.user_id')::uuid);
-- (repeat per table)
```

The FastAPI auth dependency sets `SET LOCAL app.user_id = '<uuid>'` at the start of each
request's transaction. Even a SQL-injection or a forgotten filter cannot cross tenants.

```python
# FastAPI dependency (sketch)
async def current_user(request: Request) -> User:
    token = request.cookies.get("__session")
    claims = verify_jwt(token, jwks=clerk_jwks)      # RS256 + JWKS cache
    return User(id=claims["sub"], email=claims["email"])

async def scoped_db(user: User = Depends(current_user)):
    async with SessionLocal() as db:
        await db.execute(text("SET LOCAL app.user_id = :uid"), {"uid": user.id})
        yield db
```

---

## 6. Encryption of memory content (the trust moat)

Reflections are the crown jewels. We use **envelope encryption**:

1. A cloud KMS (AWS KMS / GCP KMS) holds the **master key** (never leaves the HSM).
2. Each user gets a **Data Encryption Key (DEK)**, generated at signup, encrypted by the
   master key, and stored alongside the user row as ciphertext.
3. Sensitive columns — `semantic_facts.fact`, `chat_messages.content`, episodic summaries —
   are encrypted with the user's DEK (AES-256-GCM) before insert.
4. Embeddings are computed on plaintext in-memory, then only the **vector** is stored
   (vectors are not reversible to text), so similarity search still works.

**Result:** a stolen database dump yields ciphertext + vectors, not readable diaries.
Marketing line you've earned: *"We encrypt your memories with a key unique to you."*

> **Advanced option (v2): user-held key / zero-knowledge mode.** Derive the DEK from the
> user's passkey so *we* cannot decrypt without the user present. Maximum privacy, but it
> breaks server-side background jobs (consolidation/decay) — so offer it as an opt-in
> "private vault" tier rather than the default.

---

## 7. Threat model & mitigations

| Threat | Mitigation |
|---|---|
| Stolen access token (XSS) | httpOnly cookies, strict CSP, 15-min TTL |
| Stolen refresh token | one-time-use rotation + reuse detection → revoke family |
| Credential stuffing | passwordless (no passwords to stuff) + rate limits |
| Account takeover | step-up TOTP for export/delete/decrypt |
| Cross-tenant data leak | Postgres RLS, not just app-layer checks |
| DB exfiltration | per-user envelope encryption of sensitive columns |
| Email enumeration | uniform responses + rate limits on magic-link/login |
| Session fixation | new session on every auth; device binding |
| Insider access | encryption keys in KMS, audited; no plaintext memory in logs |

---

## 8. Compliance & user rights

- **Export:** one endpoint returns the user's full memory archive (JSON), gated by TOTP.
- **Delete:** hard-delete cascades across Postgres rows, Redis buffers, and vector rows;
  destroy the user's DEK so any lingering backup ciphertext becomes unrecoverable
  (crypto-shredding).
- **Audit log:** append-only record of sensitive events (login from new device, export,
  delete, decryption-mode change).
- **Data minimization:** we never log memory content; observability captures IDs and
  metrics only.

---

## 9. Rollout plan

1. **Phase 1 (launch):** Clerk (passkeys + Google/Apple + magic link), httpOnly cookies,
   JWT verification in FastAPI, Postgres RLS, TLS everywhere.
2. **Phase 2:** envelope encryption of sensitive columns via KMS; TOTP step-up on
   export/delete; refresh-token reuse detection dashboards.
3. **Phase 3:** opt-in zero-knowledge "private vault"; SOC 2 readiness; per-device session
   management UI ("you're signed in on 3 devices").

---

**See also:** [`database.md`](./database.md) for how `user_id`, RLS, and encrypted columns
map onto the schema, and [`product-plan.md`](./product-plan.md) for how the "your memory is
yours" promise becomes a product surface users can see and trust.
