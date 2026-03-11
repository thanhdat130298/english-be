# Step 2 — Business Analysis (Sprint 1 Backend)

This document defines **business purpose**, **inputs/outputs**, **data models**, **validation**, **ownership/security**, and **edge cases** for each Sprint 1 feature.

## Shared conventions (applies to all features)

### Identity & ownership

- All user-owned data tables include a `userId` foreign key to `User`.
- For authenticated endpoints, the **caller’s identity** is derived from the **JWT** (never from request body/query).
- Any access to a user-owned record must enforce:
  - `record.userId === auth.userId`

### API shape (baseline)

- **REST-ish JSON** endpoints.
- Errors use NestJS HTTP exceptions (status code + message). Validation failures return `400`.
- Timestamps use ISO strings in responses (`createdAt`, `updatedAt`).

### Environment variables (Sprint 1)

- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET`
- `JWT_EXPIRES_IN` (e.g. `15m`, `1h`)
- `DEEPL_API_KEY`
- `DEEPL_API_URL` (default: DeepL v2 endpoint; settable for free/pro)

### Text normalization for caching (translation)

To maximize cache hit rate and correctness:

- `normalizedText = text.trim()` (no internal whitespace rewriting in Sprint 1)
- Cache key includes: `normalizedText`, `sourceLang`, `targetLang`

## Feature: Authentication

### Business purpose

Enable a user to create an account and obtain a JWT to access protected endpoints and keep data private per user.

### Inputs / outputs

#### Register

- **Input**: `{ username, password }`
- **Output**: created user metadata (no password) and/or token (decision: Sprint 1 will return **token** to reduce client steps).

#### Login

- **Input**: `{ username, password }`
- **Output**: `{ accessToken }` (JWT)

#### Authenticated access

- **Input**: `Authorization: Bearer <jwt>`
- **Output**: `req.user` populated with `{ userId, username }` (minimal claims)

### Data models involved

#### `User`

- `id` (UUID)
- `username` (unique)
- `passwordHash`
- `createdAt`, `updatedAt`

### Validation rules

- `username`
  - required
  - trimmed
  - length: 3..32
  - allowed chars: `[a-zA-Z0-9_]+` (simple, predictable)
- `password`
  - required
  - length: 8..72 (bcrypt practical upper bound; avoid DoS on huge inputs)

### Ownership & security rules

- Passwords are stored **only** as bcrypt hashes.
- Login uses constant-time comparison via bcrypt verify.
- JWT secret is **env-only**.
- JWT payload includes `sub=userId` and `username` (optional claim for debugging/UI).

### Edge cases

- Username already exists → `409 Conflict`.
- Wrong username/password → `401 Unauthorized` (do not reveal which one).
- Leading/trailing spaces in username → trimmed before checks.
- Extremely long password → reject by validation.

## Feature: Translation (DeepL + DB cache)

### Business purpose

Allow a user to translate a sentence/phrase and reuse the translation result efficiently via server-side caching.

### Inputs / outputs

#### Translate

- **Input**: `{ text, sourceLang?, targetLang }`
  - `sourceLang` optional: if omitted, DeepL auto-detects (store as `null` or `"auto"` representation)
- **Output**: translated result with metadata:
  - `{ text, sourceLang, targetLang, detectedSourceLang?, translatedText, cached }`

### Data models involved

#### `TranslationCache`

- `id` (UUID)
- `normalizedText`
- `sourceLang` (nullable)
- `targetLang`
- `translatedText`
- `detectedSourceLang` (nullable)
- `provider` (`"deepl"`)
- `createdAt`, `updatedAt`

Notes:

- Cache is **global** (not per-user), because translation of the same input is the same output and contains no user-private data.

### Validation rules

- `text`
  - required, trimmed
  - length: 1..5000 (DeepL typical limits; configurable later, but enforce a safe cap in Sprint 1)
- `targetLang`
  - required
  - uppercase ISO-like language codes (e.g., `EN`, `EN-US`, `DE`) — allow pattern: `^[A-Z]{2}(-[A-Z]{2})?$`
- `sourceLang`
  - optional
  - same pattern as targetLang

### Ownership & security rules

- Endpoint requires auth (JWT) to prevent anonymous abuse of paid API quota.
- Rate limiting is **excluded** in Sprint 1 (documented for later).

### Edge cases

- Same `text+sourceLang+targetLang` requested concurrently:
  - Use a unique constraint on `(normalizedText, sourceLang, targetLang)` to prevent duplicates.
  - If a race occurs, one insert may fail; service should handle and re-read cached row.
- DeepL errors (quota exceeded, invalid key, upstream downtime) → map to `502 Bad Gateway` or `503 Service Unavailable` depending on error type.
- Very long or empty input → validation failure.

## Feature: Vocabulary (CRUD, user-owned)

### Business purpose

Let a user store words/phrases with meaning and optional example, optionally referencing the source text that produced it.

### Inputs / outputs

#### Create vocab

- **Input**: `{ word, meaning, example?, sourceText? }`
- **Output**: created vocab item

#### List vocab

- **Input**: paging params (Sprint 1 minimal): `?skip&take` optional
- **Output**: list of vocab items for the authenticated user

#### Get vocab by id

- **Input**: `:id`
- **Output**: vocab item if owned

#### Update vocab

- **Input**: `:id` + partial body `{ word?, meaning?, example?, sourceText? }`
- **Output**: updated vocab item if owned

#### Delete vocab

- **Input**: `:id`
- **Output**: `{ deleted: true }` (or 204)

### Data models involved

#### `Vocabulary`

- `id` (UUID)
- `userId` (FK → User)
- `word` (the vocabulary token/phrase)
- `meaning` (user’s note/translation)
- `example` (optional)
- `sourceText` (optional; often the sentence that was translated)
- `createdAt`, `updatedAt`

### Validation rules

- `word`
  - required on create
  - trimmed
  - length: 1..128
- `meaning`
  - required on create
  - trimmed
  - length: 1..512
- `example`
  - optional, trimmed
  - length: 0..512
- `sourceText`
  - optional, trimmed
  - length: 0..5000
- Pagination:
  - `take` min 1 max 100
  - `skip` min 0

### Ownership & security rules

- All reads/writes filter by `userId` from JWT.
- If vocab id exists but is not owned → respond as `404 Not Found` (do not leak existence).

### Edge cases

- Duplicate entries: allowed in Sprint 1 (user may save same word with different meaning/context).
- Deleting vocab that is in wordlists:
  - DB should enforce cascade or restrict + clean join table; choose deterministic behavior in schema (documented in schema notes later).

## Feature: Wordlists (CRUD + add/remove vocab)

### Business purpose

Allow users to group vocabulary items into named lists for later learning flows.

### Inputs / outputs

#### Create wordlist

- **Input**: `{ name, description? }`
- **Output**: created wordlist

#### List wordlists

- **Output**: wordlists for the authenticated user

#### Update wordlist

- **Input**: `:id` + `{ name?, description? }`
- **Output**: updated wordlist if owned

#### Delete wordlist

- **Input**: `:id`
- **Output**: `{ deleted: true }` (or 204). Membership rows removed as well.

#### Add vocab to wordlist

- **Input**: `:wordlistId/items` + `{ vocabularyId }`
- **Output**: membership record or `{ added: true }`

#### Remove vocab from wordlist

- **Input**: `DELETE :wordlistId/items/:vocabularyId`
- **Output**: `{ removed: true }` (or 204)

#### List wordlist items

- **Input**: `:id/items`
- **Output**: vocabulary items in that list (join)

### Data models involved

#### `Wordlist`

- `id` (UUID)
- `userId` (FK → User)
- `name`
- `description` (optional)
- `createdAt`, `updatedAt`

#### `WordlistItem` (join table)

- `wordlistId` (FK → Wordlist)
- `vocabularyId` (FK → Vocabulary)
- `createdAt`

### Validation rules

- `name`
  - required on create
  - trimmed
  - length: 1..64
- `description`
  - optional, trimmed
  - length: 0..256
- `vocabularyId`
  - required UUID

### Ownership & security rules

- Wordlist CRUD is restricted by `wordlist.userId`.
- Adding/removing vocab requires:
  - wordlist is owned by caller
  - vocabulary is owned by caller
- If either exists but not owned → `404 Not Found`.

### Edge cases

- Add same vocabulary to same wordlist twice:
  - Prevent via unique constraint `(wordlistId, vocabularyId)`; treat repeats as idempotent (return existing).
- Deleting a wordlist should delete its join rows.
- Deleting vocabulary should delete join rows (or be blocked); choose deterministic behavior at DB level.

## Feature: Progress (basic stats)

### Business purpose

Provide the user minimal “how much have I added” stats to support motivation and basic insights.

### Inputs / outputs

#### Get progress summary

- **Input**: optional `?date=YYYY-MM-DD` (defaults to today, server timezone UTC)
- **Output**:
  - `totalVocabularyCount`
  - `dailyAddedVocabularyCount` (for the requested date)

### Data models involved

- `Vocabulary` (counts by `userId` and `createdAt` date)

### Validation rules

- `date`
  - optional
  - must match `YYYY-MM-DD`
  - interpreted as UTC day boundaries in Sprint 1

### Ownership & security rules

- Stats computed only from the authenticated user’s vocabulary.

### Edge cases

- User has no vocabulary → counts are `0`.
- Timezone ambiguity:
  - Use UTC for Sprint 1; document for future “user timezone preference”.


