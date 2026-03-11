## Progress

### GET /progress/summary

Requires JWT.

#### Default (today, UTC)

**Request**

```http
GET /progress/summary
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
GET /progress/summary?date=2026-02-01
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






