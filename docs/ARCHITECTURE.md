# Päringuhaldus.ee – analüüs ja arendusplaan

**Staatus:** ainult plaan (teostust ei ole alustatud).  
**Kohustuslik:** 100% PHP-vaba — Next.js 16 + TypeScript + PostgreSQL/Prisma + Auth.js + Vercel.

---

## 1. Praegune seis (analüüs)

### Repo
| Element | Seis |
|---------|------|
| Next.js / `package.json` | Puudub (scaffold katkestati) |
| PHP failid | 13× `.php` kaustas `legacy/` (+ assets, schema, README) |
| Runtime | PHP ei jookse; Vercelil on tühi leht `paringuhaldus.ee` peal |
| Andmebaas | MySQL skeem `legacy/schema.sql` — tootmisandmeid selles repos ei ole |

### Legacy funktsioonid → TypeScript asendus

| Legacy | Funktsioon | Asendus (Next.js) |
|--------|------------|-------------------|
| `index.php` | Avalik landing | `app/(marketing)/page.tsx` |
| `register.php` | Ettevõtte + admin registreerimine | Server Action + Auth.js + Prisma |
| `login.php` / `logout.php` | Sessioon-auth | Auth.js Credentials |
| `dashboard.php` | Statistikad, tänased tegevused | `app/(app)/dashboard` |
| `inquiries.php` + filters | Nimekiri / filtrid | Server Components + searchParams |
| `inquiry-new/edit/view.php` | CRUD, märkmed, activity, assignee | Server Actions + Zod + RHF |
| `settings.php` | Slug + tiim | `app/(app)/settings` |
| `p.php` + `router.php` | Avalik vorm `/p/{slug}` | `app/p/[slug]` + honeypot |
| `config.php` | PDO, CSRF, slug, õigused | `lib/db`, `lib/auth`, `lib/tenant`, Zod |
| `schema.sql` (MySQL) | users/inquiries/notes/activities | Prisma + PostgreSQL |
| `assets/*` | CSS/JS | Tailwind 4 + shadcn/ui + Motion |

### Säilitatavad ärireeglid (mitte PHP)
- Mitme kasutaja konto (praegu `account_id`)
- Rollid admin / user
- Päringu staatused: `uus`, `töös`, `pakkumine`, `võidetud`, `kaotatud`
- Vastutaja, järgmine tegevus, märkmed, activity log
- Avalik unikaalne slug + vorm
- CSRF/honeypot ekvivalendid (Auth.js + Server Actions + honeypot väli)

### SaaS-i lüngad legacy’s
- Puudub eraldi tenant (`Organization`)
- Puuduvad plaanid / Stripe / superadmin
- Tenant isolatsioon on kaudne (`user_id` = account owner)

### PHP poliitika
1. Legacy kasutatakse **ainult** funktsioonide ja andmemudeli spetsifikatsioonina.
2. Enne esimest production deploy’t eemaldatakse **kõik** `.php` failid ja PHP-põhine dokumentatsioon runtime’ist.
3. Uues koodis ei tohi olla PHP runtime’i, Composerit ega PHP hostimist.

---

## 2. Sihtarhitektuur (100% TypeScript)

```
src/
  app/
    (marketing)/          # /, hinnad, kontakt
    (auth)/               # /login, /register
    (app)/                # tenant töökeskkond (middleware kaitstud)
      dashboard/
      inquiries/
      settings/
    (admin)/              # platvormi superadmin
    p/[slug]/             # avalik päringuvorm
    api/
      auth/[...nextauth]/
      webhooks/stripe/
      health/
  components/             # shadcn + domain
  lib/
    auth/                 # Auth.js
    db/                   # Prisma client
    tenant/               # requireMembership, org scope
    validations/          # Zod
    email/                # Resend + React Email
    billing/              # Stripe
prisma/
  schema.prisma
```

### Andmemudel (Prisma / PostgreSQL) – laiendatav

- **Organization** — tenant (name, regCode, address, **slug** unique)
- **User** — Auth.js user (email, passwordHash, name, status, `isSuperAdmin`)
- **Membership** — user ↔ org (role: `OWNER` | `ADMIN` | `MEMBER`)
- **Inquiry** — organizationId, assigneeId, kliendi väljad, status, value, nextAction*
- **InquiryNote**, **InquiryActivity**
- **Plan**, **Subscription** — Stripe Billing (PART 5)
- Auth.js vajalikud tabelid (Account / Session / VerificationToken vastavalt adapterile)

### Turvalisus
- Kõik tenant-andmed: `organizationId` + serveripoolne `requireMembership`
- Õigused Server Actions / Route Handlersis (mitte ainult UI)
- Zod kõigil sisenditel
- Stripe webhook allkirja kontroll
- Avalik vorm: honeypot + rate limiting (valmistus)

### Isolatsioon
Iga päring/note/activity loetakse/kirjutatakse ainult aktiivse org konteksti kaudu. Superadmin näeb kõiki orge eraldi admin-ruumis.

---

## 3. Prioriteetne arendusplaan

### PART 0 – PHP eemaldamine + spetsi fikseerimine
- Ekstrakti ärireeglid sellest dokumendist / legacy’st
- Kustuta kogu `legacy/` (ja kõik `.php`) enne või koos PART 1 lõpuga
- Uuenda `.gitignore` / README Next.js jaoks

### PART 1 – Vundament
- Scaffold Next.js 16 App Router, React 19, TS, Tailwind 4, ESLint
- shadcn/ui + Radix + Lucide baas
- Prisma skeem + client (PostgreSQL)
- Route group’ide kestad
- `lib/auth`, `lib/db`, `lib/tenant`, Zod stub’id
- Minimal marketing landing (Eesti copy)
- `npm run build` / `dev` OK
- **Null PHP faili repos**

### PART 2 – Auth + org
- Auth.js: register (org + OWNER), login, logout
- Middleware: kaitstud `/app`, `/admin`
- Session: userId, organizationId, rollid

### PART 3 – Töökeskkond
- Dashboard (statistikad, tänased tegevused, määramata)
- Inquiries CRUD + filtrid + assignee + next action
- Notes + activity log
- Settings: slug, tiim (ADMIN+)

### PART 4 – Avalik vorm + e-post
- `/p/[slug]` (Zod, honeypot)
- Resend + React Email teavitus org’ile

### PART 5 – Billing + superadmin + polish
- Stripe Billing (plaanid, checkout, portaal, webhooks)
- Superadmin: org’d, kasutajad, tellimused
- Recharts dashboard
- Motion animatsioonid
- Deploy Vercel + env (DATABASE_URL, AUTH_*, STRIPE_*, RESEND_*)

---

## 4. Teostuse reegel

- Selles dokumendis kirjeldatud plaan on heakskiidu alus.
- **Järgmine samm alles pärast kasutaja kinnitust** (nt „tee PART 0+1“).
- Automaatselt järgmisi PART-e ei alustata.

---

## 5. PART 1 edukriteeriumid (kui kinnitatakse)

- [ ] `package.json` + Next.js 16 töötab
- [ ] Prisma schema + generate OK
- [ ] Route grupid olemas
- [ ] `npm run build` edukas
- [ ] `Get-ChildItem -Recurse -Filter *.php` → 0 faili
- [ ] Dokumentatsioon kirjeldab ainult TypeScript/Next stacki
