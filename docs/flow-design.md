# Step 3 — Flow Design (Sprint 1 Backend)

This document defines the exact flow for each feature:

**Client → Controller → Guard → Service → Prisma → PostgreSQL → Response**

No business logic belongs in controllers; guards enforce authentication; services enforce ownership and business rules; Prisma is the only DB access layer.

## Common request lifecycle (authenticated endpoints)

1. **Client**
  - Sends `Authorization: Bearer <accessToken>` header.
2. **Controller**
  - Receives request DTO and delegates to service.
3. **Guard**
  - JWT guard validates token signature/expiration.
  - Populates `req.user = { userId, username }`.
4. **Service**
  - Uses `userId` from `req.user` to scope all queries.
  - Runs business rules and calls Prisma.
5. **Prisma**
  - Executes parameterized queries.
6. **PostgreSQL**
  - Enforces constraints + foreign keys.
7. **Response**
  - Controller returns service result (already in response DTO shape).

## Authentication

### Register flow

1. **Client** → `POST /auth/register` `{ username, password }`
2. **Controller** → validates `RegisterDto`, calls `AuthService.register(dto)`
3. **Guard** → none (public)
4. **Service**
  - normalize username (trim)
  - hash password with bcrypt
  - create `User` via Prisma
  - sign JWT for new user
5. **Prisma** → `user.create({ data: { username, passwordHash } })`
6. **PostgreSQL**
  - unique constraint on `username` ensures no duplicates
7. **Response** → `{ accessToken }` (and optionally user id/username)

### Login flow

1. **Client** → `POST /auth/login` `{ username, password }`
2. **Controller** → validates `LoginDto`, calls `AuthService.login(dto)`
3. **Guard** → none (public)
4. **Service**
  - normalize username (trim)
  - fetch user by username
  - bcrypt compare
  - sign JWT
5. **Prisma** → `user.findUnique({ where: { username } })`
6. **PostgreSQL** → returns user row
7. **Response** → `{ accessToken }`

## Translation (DeepL + cache)

### Translate flow (cached-first)

1. **Client** → `POST /translate` `{ text, sourceLang?, targetLang }` + JWT
2. **Controller**
  - validates `TranslateDto`
  - calls `TranslateService.translate(dto)`
3. **Guard** → JWT guard populates `req.user`
4. **Service**
  - normalize text (trim)
  - attempt cache lookup by `(normalizedText, sourceLang, targetLang)`
  - if found: return `{ cached: true, ... }`
  - else:
    - call DeepL HTTP API
    - insert cache row with unique constraint
    - if insert conflicts due to race: re-read cached row
    - return `{ cached: false, ... }`
5. **Prisma**
  - `translationCache.findUnique(...)` (composite unique)
  - `translationCache.create(...)` (or `upsert` if used)
6. **PostgreSQL**
  - enforces composite uniqueness
7. **Response**
  - consistent translation response (whether cached or new)

## Vocabulary (CRUD)

### Create vocab flow

1. **Client** → `POST /vocabulary` body + JWT
2. **Controller** → validates `CreateVocabularyDto`, calls `VocabularyService.create(userId, dto)`
3. **Guard** → JWT
4. **Service**
  - uses `userId` from JWT
  - persists vocab row
5. **Prisma** → `vocabulary.create({ data: { userId, ...dto } })`
6. **PostgreSQL** → inserts row
7. **Response** → created vocab item

### List vocab flow

1. **Client** → `GET /vocabulary?skip&take` + JWT
2. **Controller** → parses pagination, calls service
3. **Guard** → JWT
4. **Service** → fetches by `userId` with pagination/sort
5. **Prisma** → `vocabulary.findMany({ where: { userId }, skip, take, orderBy: { createdAt: 'desc' } })`
6. **PostgreSQL** → returns rows
7. **Response** → list

### Get/update/delete vocab flow (ownership enforced)

1. **Client** → `GET|PATCH|DELETE /vocabulary/:id` + JWT
2. **Controller** → validates `id` + dto, calls service
3. **Guard** → JWT
4. **Service**
  - fetches record by `id` and `userId` (or updates/deletes with both filters)
  - if not found → 404
5. **Prisma**
  - preferred: `findFirst({ where: { id, userId } })`
  - update/delete similarly scoped by both fields where possible
6. **PostgreSQL** → enforces FK constraints
7. **Response** → item or confirmation

## Wordlists (CRUD + add/remove vocabulary)

### Create/list/update/delete wordlist flow

1. **Client** → `POST|GET|PATCH|DELETE /wordlists` / `/wordlists/:id` + JWT
2. **Controller** → validates dto, calls `WordlistService.*(userId, ...)`
3. **Guard** → JWT
4. **Service**
  - scopes all operations to `userId`
  - ensures `name` constraints
5. **Prisma**
  - `wordlist.create/findMany/findFirst/update/delete` with `userId` filter
6. **PostgreSQL** → FK + cascade behavior for join rows
7. **Response** → wordlist data

### Add vocab to wordlist flow (membership)

1. **Client** → `POST /wordlists/:wordlistId/items` `{ vocabularyId }` + JWT
2. **Controller** → validates IDs, calls `WordlistService.addItem(userId, wordlistId, vocabularyId)`
3. **Guard** → JWT
4. **Service**
  - verifies wordlist belongs to user (`wordlistId + userId`)
  - verifies vocabulary belongs to user (`vocabularyId + userId`)
  - creates join row; if exists, returns idempotent success
5. **Prisma**
  - `wordlist.findFirst({ where: { id: wordlistId, userId } })`
  - `vocabulary.findFirst({ where: { id: vocabularyId, userId } })`
  - `wordlistItem.create({ data: { wordlistId, vocabularyId } })` (handle unique conflict)
6. **PostgreSQL** → enforces join uniqueness
7. **Response** → membership created or already exists

### Remove vocab from wordlist flow

1. **Client** → `DELETE /wordlists/:wordlistId/items/:vocabularyId` + JWT
2. **Controller** → validates IDs, calls service
3. **Guard** → JWT
4. **Service**
  - verifies wordlist belongs to user
  - deletes join row (idempotent: deleting non-existent is ok → 204 or `{ removed: false }`)
5. **Prisma** → `wordlistItem.deleteMany({ where: { wordlistId, vocabularyId } })` (plus ownership pre-check)
6. **PostgreSQL** → deletes rows
7. **Response** → 204 or confirmation

### List items in wordlist flow

1. **Client** → `GET /wordlists/:id/items` + JWT
2. **Controller** → validates `id`, calls service
3. **Guard** → JWT
4. **Service**
  - verifies list belongs to user
  - returns vocabulary items via join
5. **Prisma**
  - either `wordlistItem.findMany({ where: { wordlistId }, include: { vocabulary: true } })`
  - or `vocabulary.findMany({ where: { wordlistItems: { some: { wordlistId } }, userId } })`
6. **PostgreSQL** → join query
7. **Response** → vocabulary array

## Progress (basic stats)

### Progress summary flow

1. **Client** → `GET /progress/summary?date=YYYY-MM-DD` + JWT
2. **Controller** → validates query, calls `ProgressService.getSummary(userId, date?)`
3. **Guard** → JWT
4. **Service**
  - computes:
    - total count of vocab for user
    - count of vocab created within UTC day range for the requested date (or today)
5. **Prisma**
  - `vocabulary.count({ where: { userId } })`
  - `vocabulary.count({ where: { userId, createdAt: { gte: startOfDayUtc, lt: nextDayUtc } } })`
6. **PostgreSQL** → aggregate counts
7. **Response** → `{ totalVocabularyCount, dailyAddedVocabularyCount, date }`


