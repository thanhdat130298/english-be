## Progress

### GET /api/progress/summary

Requires JWT.

#### Default (today, UTC)

**Request**

```http
GET /api/progress/summary
Authorization: Bearer <accessToken>
```

**200 Response**

```json
{
  "date": "2026-02-01",
  "totalVocabularyCount": 12,
  "dailyAddedVocabularyCount": 3
}
```

#### Specific date

**Request**

```http
GET /api/progress/summary?date=2026-02-01
Authorization: Bearer <accessToken>
```

**200 Response**

```json
{
  "date": "2026-02-01",
  "totalVocabularyCount": 12,
  "dailyAddedVocabularyCount": 3
}
```

**400 Validation error (example)**

```json
{
  "message": [
    "date must be YYYY-MM-DD"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### GET /api/progress/dashboard

Query optional: `from`, `to` (định dạng `YYYY-MM-DD`, UTC).

**Request**

```http
GET /api/progress/dashboard?from=2026-03-17&to=2026-03-23
Authorization: Bearer <accessToken>
```

**200 Response**

```json
{
  "summary": {
    "date": "2026-03-23",
    "totalVocabularyCount": 120,
    "dailyAddedVocabularyCount": 5
  },
  "activitySeries": [
    { "date": "2026-03-17", "addedCount": 2 },
    { "date": "2026-03-18", "addedCount": 4 }
  ],
  "streak": {
    "currentStreakDays": 6,
    "longestStreakDays": 12,
    "lastActiveDate": "2026-03-23"
  },
  "wordlistsSummary": {
    "wordlistCount": 8,
    "categoryCount": 5
  },
  "recentActivity": [
    {
      "id": "uuid",
      "type": "VOCAB_ADDED",
      "target": "serendipity",
      "createdAt": "2026-03-23T09:00:00.000Z"
    },
    {
      "id": "uuid",
      "type": "WORDLIST_CREATED",
      "target": "IELTS Prep",
      "createdAt": "2026-03-23T08:10:00.000Z"
    }
  ]
}
```

**400 Validation error (example)**

```json
{
  "message": [
    "from must be YYYY-MM-DD"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### GET /api/progress/leaderboard

Query optional:
- `date=YYYY-MM-DD`
- `limit=10` (1-100)

**Request**

```http
GET /api/progress/leaderboard?date=2026-03-23&limit=10
Authorization: Bearer <accessToken>
```

**200 Response**

```json
{
  "topStreakUsers": [
    { "userId": "sample-1", "username": "alice", "value": 32 },
    { "userId": "sample-2", "username": "bob", "value": 27 },
    { "userId": "sample-3", "username": "charlie", "value": 19 }
  ],
  "topAddedUsers": [
    { "userId": "sample-4", "username": "david", "value": 180 },
    { "userId": "sample-5", "username": "eva", "value": 156 },
    { "userId": "sample-6", "username": "frank", "value": 149 }
  ],
  "topReviewUsers": [
    { "userId": "sample-7", "username": "grace", "value": 420 },
    { "userId": "sample-8", "username": "henry", "value": 380 },
    { "userId": "sample-9", "username": "irene", "value": 355 }
  ],
  "topTranslatedWords": [
    { "userId": "word-1", "username": "practice", "value": 48 },
    { "userId": "word-2", "username": "synchronize", "value": 35 },
    { "userId": "word-3", "username": "pathway", "value": 27 }
  ]
}
```






