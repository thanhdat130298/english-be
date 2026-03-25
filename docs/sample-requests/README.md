## Sample Requests (Sprint 1)

All endpoints are documented in Swagger at `/swagger`. Use these samples for quick copy/paste testing.

### Base URL

- Local default: `http://localhost:3000`

### Auth header (protected endpoints)

After login/register you will get an `accessToken`. Use it like:

```http
Authorization: Bearer <accessToken>
```

### Endpoints covered

- Auth: `POST /auth/register`, `POST /auth/login`
- Translate: `POST /translate`
- Vocabulary: `POST /vocabulary`, `GET /vocabulary`, `GET /vocabulary/:id`, `PATCH /vocabulary/:id`, `DELETE /vocabulary/:id`
- Review: `GET /api/vocab/review-queue`, `PATCH /api/vocab/:id/review` (chi tiết: `review.md`)
- Wordlists: `POST /wordlists`, `GET /wordlists`, `GET /wordlists/:id`, `PATCH /wordlists/:id`, `DELETE /wordlists/:id`, `GET /wordlists/:id/items`, `POST /wordlists/:id/items`, `DELETE /wordlists/:id/items/:vocabularyId`
- Progress: `GET /api/progress/summary`, `GET /api/progress/dashboard`, `GET /api/progress/leaderboard`
- Feedback: `POST /api/feedback`, `GET /api/feedback/mine`






