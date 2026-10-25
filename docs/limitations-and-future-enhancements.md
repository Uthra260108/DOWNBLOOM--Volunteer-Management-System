# Limitations & Future Enhancements — DawnBloom

## 1. Architectural & Security Limitations

**DawnBloom** was intentionally designed as an educational, client-side Software Engineering project for college demonstration, running entirely inside standard web browsers without requiring backend servers. Consequently, the following limitations must be noted:

### 1.1 LocalStorage is not a Secure Database
- Browser `localStorage` stores unencrypted string data in the client's local profile folder.
- Any user with access to the machine can inspect, edit, or delete stored keys via Browser Developer Tools (`F12` > Application > Local Storage).
- Storage capacity is limited by browser policy (typically 5MB–10MB per origin).

### 1.2 Client-Side Authentication is Not a Security Boundary
- The login and session guard modules (`auth.js`) operate purely in JavaScript.
- Role checks (e.g. Administrator vs. Volunteer) are cosmetic UI distinctions rather than tamper-proof cryptographic authorizations.
- **Critical Notice:** This architecture must **never** be used in production to store real-world vulnerable children's sensitive personal data or legal orphanage records.

### 1.3 Device Isolation & Non-Synchronization
- Data created in one web browser or device does not automatically replicate or synchronize with another device.
- Clearing browser cache or switching to Private/Incognito browsing will yield an isolated storage environment.

---

## 2. Privacy & Ethical Safeguards Implemented

To demonstrate responsible software engineering practices within an educational scope:
- **Anonymized Student Profiles:** Student records utilize display aliases (e.g. `Leo M.`, `Maya T.`) rather than full legal names or government IDs.
- **Omission of Sensitive Data:** No medical histories, family backgrounds, or physical addresses are solicited or stored.
- **XSS Mitigation:** All user strings rendered to the DOM undergo strict character entity escaping via `escapeHtml()`.

---

## 3. Recommended Future Enhancements for Production

When scaling DawnBloom for genuine multi-institution deployment, the following upgrades are recommended:

1. **Secure Backend Microservice:**
   - Migrate storage logic to an enterprise backend (e.g. Node.js/Express, Python/FastAPI, or Java/Spring Boot).
   - Employ an encrypted relational database (e.g., PostgreSQL with Row-Level Security).

2. **Cryptographic Authentication & RBAC:**
   - Implement OAuth2 / OpenID Connect with bcrypt/Argon2 password hashing and HTTP-only JWT cookies.
   - Enforce server-side Role-Based Access Control (RBAC) ensuring volunteers can only review their assigned students.

3. **Multi-Tenant Cloud Sync:**
   - Allow regional shelter networks to share coordinated volunteer pools across multiple branches.
   - WebSockets or Server-Sent Events (SSE) for real-time notification broadcasts.

4. **iCalendar & SMS Scheduling Integrations:**
   - Export guidance sessions and event schedules into `.ics` format for Google Calendar / Apple Calendar synchronization.
   - Twilio SMS reminders sent to mentors prior to tutoring commitments.

5. **Multi-Factor Child Safeguarding Compliance:**
   - Implement verifiable volunteer identity checks, police clearance certificate verification tracking, and supervisor dual-authorization for guidance session approval.
