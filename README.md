# DEMO VIDEO - [Link](https://drive.google.com/file/d/1MIQjWqqg6hTBehX3akcYxgxtrvis5RsE/view?usp=drive_link)

# Deployed Url - [Link](https://assign-credit-sea.vercel.app/)

# LMS — Loan Management System

A full-stack lending platform with a borrower-facing loan application wizard and a role-gated operations dashboard (Sales, Sanction, Disbursement, Collection, Admin). Built for the Indian lending context: PAN-based KYC, ₹ currency, simple-interest loan math.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript (strict), Tailwind CSS |
| Backend | Node.js, Express, TypeScript (strict) |
| Database | MongoDB + Mongoose |
| Auth | JWT in an httpOnly cookie + bcrypt password hashing |
| Validation | Zod (server), mirrored client-side checks for instant feedback |

## Prerequisites

- Node.js 18+ and npm
- A running MongoDB instance (local install, Docker, or MongoDB Atlas)

## Project structure

```
/lms
  /server   # Express API (src/config, models, middleware, controllers, routes, services, seed, utils)
  /client   # Next.js app (app router: (public), (borrower), (ops) route groups)
```

See inline comments in `server/src/app.ts` and `client/middleware.ts` for how requests are wired end to end.

## Setup

### 1. Backend

```bash
cd server
cp .env.example .env     # fill in MONGO_URI and JWT_SECRET
npm install
npm run seed              # wipes and repopulates the DB with fixed accounts + demo data
npm run dev                # starts the API on http://localhost:4000
```

### 2. Frontend

```bash
cd client
cp .env.example .env.local   # NEXT_PUBLIC_API_URL defaults to http://localhost:4000/api
npm install
npm run dev                   # starts the app on http://localhost:3000
```

Open `http://localhost:3000`. Unauthenticated visitors land on `/login`.

## Seeded accounts

Run `npm run seed` (inside `/server`) against a clean database to populate:

| Role | Email | Password |
|---|---|---|
| Admin | admin@lms.test | Admin@123 |
| Sales | sales@lms.test | Sales@123 |
| Sanction | sanction@lms.test | Sanction@123 |
| Disbursement | disbursement@lms.test | Disbursement@123 |
| Collection | collection@lms.test | Collection@123 |
| Borrower (demo) | borrower@lms.test | Borrower@123 |

The seed also creates six demo borrowers (password `Demo@123`) covering every stage of the loan lifecycle — a lead with no application, one `APPLIED`, one `SANCTIONED`, one `DISBURSED` with a partial payment, one fully paid `CLOSED` loan, and one `REJECTED` application — so every dashboard module is populated immediately.

## Core flows to try

1. **Borrower**: sign up → fill personal details (BRE runs live) → upload a salary slip (PDF/JPG/PNG, ≤5MB) → adjust the amount/tenure sliders and watch the repayment recalculate → apply → land on `/my-loan`.
2. **Sanction**: log in as `sanction@lms.test`, open the `APPLIED` queue, expand an application, Approve or Reject (reason required).
3. **Disbursement**: log in as `disbursement@lms.test`, mark a `SANCTIONED` loan as disbursed.
4. **Collection**: log in as `collection@lms.test`, record a payment against a `DISBURSED` loan (duplicate UTR and overpayment are rejected); once payments cover the total repayment the loan auto-closes.
5. **RBAC check**: while logged in as one ops role, try navigating directly to another module's URL (e.g. `/dashboard/collection` while logged in as Sanction) — you're redirected back to your own module. The API independently rejects the same request with `403`.

## Loan math

```
Simple Interest = (Principal × 12 × TenureDays) / (365 × 100)
Total Repayment = Principal + Simple Interest
```

Always computed server-side on submit (and again shown live client-side) — the client-sent figures are never trusted for persistence.

## BRE (Business Rule Engine) rules

An application is rejected if any of the following hold: age outside 23–50, monthly salary below ₹25,000, PAN not matching the standard `AAAAA9999A` format, or employment mode `UNEMPLOYED`. The check runs both inline (for instant feedback while filling the form) and authoritatively on the server at every step that matters — the client's earlier result is never trusted at final submit.

## Known limitations / assumptions

- **File storage**: salary slips are uploaded to Cloudinary (`server/src/config/cloudinary.ts`) - multer holds the file in memory just long enough to stream it there, nothing touches local disk. Only the resulting secure URL + metadata are persisted in MongoDB. `GET /api/applications/:id/salary-slip` still runs the same auth/ownership check as every other route before redirecting to that URL, so slips aren't just sitting behind a guessable public link.
- **Cloudinary PDF delivery is disabled by default on new accounts.** As a security measure, Cloudinary blocks public delivery of PDF and ZIP files account-wide (confirmed: this applies regardless of `resource_type` - `image`, `raw`, and even signed `authenticated` delivery all return `401` for a `.pdf` URL until this is turned on). If salary slip PDFs upload successfully (visible in the Cloudinary Media Library) but the link fails to load, go to the Cloudinary console → **Settings → Security** → enable **"Allow delivery of PDF and ZIP files"** → Save. JPG/PNG slips are unaffected either way.
- **Cookies across origins**: the JWT cookie is set as `SameSite=Lax`, which works for local dev (`localhost:3000` ↔ `localhost:4000` are same-site) and for same-domain production deployments (e.g. API behind `/api` on the same domain via a reverse proxy). If the API and client are deployed on genuinely different registrable domains, switch to `SameSite=None; Secure` and ensure HTTPS everywhere.
- **No pagination**: dashboard tables load the full filtered result set. Fine at demo scale; would need cursor/offset pagination for a large production loan book.
- **One active loan per borrower**: a borrower can't have more than one application in flight at a time (`server/src/controllers/applications.controller.ts` - `submitApplication`). "In flight" means any status other than `REJECTED`/`CLOSED` - a rejected or fully-repaid borrower can apply again, but not while an application is still awaiting a decision or being repaid. This matters for real credit risk: each application's BRE check only evaluates income against *that* loan, not combined exposure across several simultaneous ones. Enforced server-side (`409 ACTIVE_APPLICATION_EXISTS`); the wizard and `/my-loan` also hide the "apply again" entry points while an active application exists, so the UI doesn't invite an action the API will just reject.
- **No notifications/email/SMS/payment gateway integration** — intentionally out of scope per the brief.

## Definition of done checklist

- [x] All 6 seeded accounts log in and land on/see only their permitted module(s)
- [x] BRE rejects on each of the 4 rules individually and passes a valid applicant
- [x] Loan math (SI, total repayment) matches the formula
- [x] Full lifecycle reachable: `APPLIED → SANCTIONED → DISBURSED → payments → CLOSED`, plus `APPLIED → REJECTED`
- [x] Direct-URL access to another role's dashboard route is blocked on both frontend and API
- [x] Duplicate UTR rejected (unique index + error handling); overpayment beyond outstanding balance rejected
- [x] No gradients / generic "AI-template" visual tells
- [x] `.env.example` present for both apps; `npm run seed` works from a clean DB
- [x] README complete with credentials table
