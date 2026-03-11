## Vocabulary

All endpoints require JWT and operate on **user-owned** vocabulary.

### POST /vocabulary

**Request**

```http
POST /vocabulary
Content-Type: application/json
Authorization: Bearer <accessToken>
```

```json
{
  "word": "take for granted",
  "meaning": "to accept something as normal without thinking about it",
  "example": "I took electricity for granted until the blackout.",
  "sourceText": "I took electricity for granted until the blackout."
}
```

**201 Response**

```json
{
  "id": "0b9d4e77-07d6-4b1d-9bbf-61efc5cb57ef",
  "userId": "0cb6e6c6-4c2d-4c77-9c2b-2d5c0f4b2d4f",
  "word": "take for granted",
  "meaning": "to accept something as normal without thinking about it",
  "example": "I took electricity for granted until the blackout.",
  "sourceText": "I took electricity for granted until the blackout.",
  "createdAt": "2026-02-01T15:00:00.000Z",
  "updatedAt": "2026-02-01T15:00:00.000Z"
}
```

**400 Validation error (example)**

```json
{
  "message": [
    "word must be longer than or equal to 1 characters"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### GET /vocabulary?skip=&take=

**Request**

```http
GET /vocabulary?skip=0&take=50
Authorization: Bearer <accessToken>
```

**200 Response**

```json
[
  {
    "id": "0b9d4e77-07d6-4b1d-9bbf-61efc5cb57ef",
    "userId": "0cb6e6c6-4c2d-4c77-9c2b-2d5c0f4b2d4f",
    "word": "take for granted",
    "meaning": "to accept something as normal without thinking about it",
    "example": "I took electricity for granted until the blackout.",
    "sourceText": "I took electricity for granted until the blackout.",
    "createdAt": "2026-02-01T15:00:00.000Z",
    "updatedAt": "2026-02-01T15:00:00.000Z"
  }
]
```

### GET /vocabulary/:id

**Request**

```http
GET /vocabulary/0b9d4e77-07d6-4b1d-9bbf-61efc5cb57ef
Authorization: Bearer <accessToken>
```

**200 Response**

```json
{
  "id": "0b9d4e77-07d6-4b1d-9bbf-61efc5cb57ef",
  "userId": "0cb6e6c6-4c2d-4c77-9c2b-2d5c0f4b2d4f",
  "word": "take for granted",
  "meaning": "to accept something as normal without thinking about it",
  "example": "I took electricity for granted until the blackout.",
  "sourceText": "I took electricity for granted until the blackout.",
  "createdAt": "2026-02-01T15:00:00.000Z",
  "updatedAt": "2026-02-01T15:00:00.000Z"
}
```

**404 Not found / not owned**

```json
{
  "message": "vocabulary not found",
  "error": "Not Found",
  "statusCode": 404
}
```

### PATCH /vocabulary/:id

**Request**

```http
PATCH /vocabulary/0b9d4e77-07d6-4b1d-9bbf-61efc5cb57ef
Content-Type: application/json
Authorization: Bearer <accessToken>
```

```json
{
  "meaning": "to assume something will always be available"
}
```

**200 Response**

```json
{
  "id": "0b9d4e77-07d6-4b1d-9bbf-61efc5cb57ef",
  "userId": "0cb6e6c6-4c2d-4c77-9c2b-2d5c0f4b2d4f",
  "word": "take for granted",
  "meaning": "to assume something will always be available",
  "example": "I took electricity for granted until the blackout.",
  "sourceText": "I took electricity for granted until the blackout.",
  "createdAt": "2026-02-01T15:00:00.000Z",
  "updatedAt": "2026-02-01T15:05:00.000Z"
}
```

### DELETE /vocabulary/:id

**Request**

```http
DELETE /vocabulary/0b9d4e77-07d6-4b1d-9bbf-61efc5cb57ef
Authorization: Bearer <accessToken>
```

**200 Response**

```json
{
  "deleted": true
}
```






