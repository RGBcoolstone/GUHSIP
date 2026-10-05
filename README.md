# GUHSIP

# GUHSIP

> What's the sip?

GUHSIP is a social platform for discovering what people are talking about right now: music, sports, gaming, campus, entertainment, local events and more. Every post is a **Sip**. Communities can be global, national, city-level, a university campus (Miva is the first), or a topic.

## Core loop

Discover Sip → React → Discuss → Add information → Follow topic → Return for updates

## Identity modes

| Mode | Example | Notes |
|---|---|---|
| Public | `@newton` | Real identity |
| Alias | `@midnight808` | Persistent pseudonym |
| Anonymous | 👤 Anonymous | No handle shown |

Anonymous does not mean consequence-free. Reporting, moderation, anti-spam and anti-doxxing controls are part of the design, not an afterthought.

---

## Data model

The full PostgreSQL schema is in [`guhsip_schema.sql`](./guhsip_schema.sql).

### Design decisions

1. **Anonymity is structural.** `sips` and `comments` never store a `user_id`, only a `display_handle` (null when anonymous). The author link lives in `sip_authorship` and `comment_authorship`, which only a restricted database role may read. A bug in a public feed query cannot leak who wrote what.
2. **One `communities` table.** Global, country, city, campus and topic are rows distinguished by `kind` and linked with `parent_id`. Adding a campus means inserting a row, not changing the schema.
3. **Minimal personal data.** Emails are stored as hashes, passwords with argon2id.
4. **Audit trail.** `moderation_actions` is append-only.

### Tables

| Group | Tables |
|---|---|
| Accounts | `users`, `aliases` |
| Communities | `communities`, `memberships` |
| Public content | `sips`, `comments`, `sip_sources`, `topics`, `sip_topics` |
| Private links (restricted) | `sip_authorship`, `comment_authorship`, `reactions`, `follows` |
| Safety | `reports`, `moderation_actions` |

---

## Tools to install

| Tool | Purpose |
|---|---|
| Node.js (LTS) | Backend runtime |
| Git + GitHub account | Version control |
| VS Code | Editor |
| PostgreSQL (or Docker running Postgres) | Database |
| pgAdmin or DBeaver | Database client |
| Postman or Bruno | API testing |

## Project setup

```bash
mkdir guhsip && cd guhsip
npm init -y
npm i express prisma @prisma/client zod argon2 jsonwebtoken
npm i -D typescript tsx @types/node @types/express
npx prisma init
```

| Package | Purpose |
|---|---|
| express | API server |
| prisma | ORM and migrations |
| zod | Input validation |
| argon2 | Password hashing |
| jsonwebtoken | Sessions |

Frontend (later): Next.js, via `npx create-next-app@latest`.

## Database setup

```bash
createdb guhsip
psql guhsip -f guhsip_schema.sql
```

## Build order

1. Database up with the schema loaded
2. Auth (signup, login, school-mail verification)
3. Communities and Sips (create, list by community)
4. Comments, reactions, reports
5. Topic following and trending
6. Frontend

## Open questions (threat model)

- Who can link a post to an account: only the user, the database, admins, or a court order?
- What is logged (IP, device, timestamps), and for how long?
- How is re-identification through writing style or small-group context reduced?
- Can abuse be moderated without being able to unmask people?
- Which laws apply (e.g. Nigeria's Cybercrimes Act and data protection rules)?
