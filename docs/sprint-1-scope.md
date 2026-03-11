# Sprint 1 Scope (Backend) — English Learning App

## Hard constraints

- **Backend**: NestJS (TypeScript)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Auth**: JWT
- **API docs**: Swagger (OpenAPI)
- **No** Docker
- **No** microservices
- **No** over-engineering
- **End-to-end consistency** (docs ↔ code ↔ DB)

## Feature list (what Sprint 1 delivers)

| Feature | Description | Included | Explicitly excluded |
|---|---|---|---|
| Authentication | Username/password signup + login returning JWT | Register, login, bcrypt hashing, JWT access token, auth guard for protected routes | OAuth, email verification, password reset, refresh tokens, MFA, roles/admin |
| Translation (DeepL) | Server-side translation API with DB caching | Translate endpoint, DeepL call from server, cache in DB, reuse cached result | Streaming, glossary, tone/formality settings, multiple translation providers |
| Vocabulary | User-owned vocabulary CRUD | CRUD vocabulary items; belongs to a user; fields: word/phrase, meaning, example, sourceText | Public/shared vocab, tagging, audio/IPA, import/export |
| Wordlists | User-owned lists that contain vocabulary | Create/update/delete wordlists; add/remove vocab to list (many-to-many) | Sharing/collaboration, ordering, folders, advanced bulk ops |
| Progress (Basic) | Simple stats for learning progress | Total vocabulary count; daily added vocabulary count | SRS, streaks, mastery levels, quizzes/flashcards |

## Global non-functional requirements (Sprint 1)

- **Security**
  - Passwords hashed with **bcrypt**.
  - JWT protects all user-data endpoints.
  - User ownership enforced at query level (by `userId`).
- **Validation**
  - DTO-based request validation.
  - Consistent error responses via NestJS validation + exceptions.
- **Configuration**
  - No secrets in code; use environment variables.
- **Maintainability**
  - No business logic in controllers.
  - Clear module boundaries: `Auth`, `Translate`, `Vocabulary`, `Wordlist`, `Progress`, `Prisma`.


