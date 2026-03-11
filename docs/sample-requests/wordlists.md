## Wordlists

All endpoints require JWT and enforce ownership for both the wordlist and vocabulary.

### POST /wordlists

**Request**

```http
POST /wordlists
Content-Type: application/json
Authorization: Bearer <accessToken>
```

```json
{
  "name": "Travel",
  "description": "Words for traveling"
}
```

**201 Response**

```json
{
  "id": "d3c3ac3b-5f7f-47c6-a6a8-2b1c6b9d2d1a",
  "userId": "0cb6e6c6-4c2d-4c77-9c2b-2d5c0f4b2d4f",
  "name": "Travel",
  "description": "Words for traveling",
  "createdAt": "2026-02-01T15:10:00.000Z",
  "updatedAt": "2026-02-01T15:10:00.000Z"
}
```

### GET /wordlists

**Request**

```http
GET /wordlists
Authorization: Bearer <accessToken>
```

**200 Response**

```json
[
  {
    "id": "d3c3ac3b-5f7f-47c6-a6a8-2b1c6b9d2d1a",
    "userId": "0cb6e6c6-4c2d-4c77-9c2b-2d5c0f4b2d4f",
    "name": "Travel",
    "description": "Words for traveling",
    "createdAt": "2026-02-01T15:10:00.000Z",
    "updatedAt": "2026-02-01T15:10:00.000Z"
  }
]
```

### GET /wordlists/:id

**Request**

```http
GET /wordlists/d3c3ac3b-5f7f-47c6-a6a8-2b1c6b9d2d1a
Authorization: Bearer <accessToken>
```

**200 Response**

```json
{
  "id": "d3c3ac3b-5f7f-47c6-a6a8-2b1c6b9d2d1a",
  "userId": "0cb6e6c6-4c2d-4c77-9c2b-2d5c0f4b2d4f",
  "name": "Travel",
  "description": "Words for traveling",
  "createdAt": "2026-02-01T15:10:00.000Z",
  "updatedAt": "2026-02-01T15:10:00.000Z"
}
```

**404 Not found / not owned**

```json
{
  "message": "wordlist not found",
  "error": "Not Found",
  "statusCode": 404
}
```

### PATCH /wordlists/:id

**Request**

```http
PATCH /wordlists/d3c3ac3b-5f7f-47c6-a6a8-2b1c6b9d2d1a
Content-Type: application/json
Authorization: Bearer <accessToken>
```

```json
{
  "description": "Travel words (airport, hotel, directions)"
}
```

**200 Response**

```json
{
  "id": "d3c3ac3b-5f7f-47c6-a6a8-2b1c6b9d2d1a",
  "userId": "0cb6e6c6-4c2d-4c77-9c2b-2d5c0f4b2d4f",
  "name": "Travel",
  "description": "Travel words (airport, hotel, directions)",
  "createdAt": "2026-02-01T15:10:00.000Z",
  "updatedAt": "2026-02-01T15:12:00.000Z"
}
```

### DELETE /wordlists/:id

**Request**

```http
DELETE /wordlists/d3c3ac3b-5f7f-47c6-a6a8-2b1c6b9d2d1a
Authorization: Bearer <accessToken>
```

**200 Response**

```json
{
  "deleted": true
}
```

### GET /wordlists/:id/items

**Request**

```http
GET /wordlists/d3c3ac3b-5f7f-47c6-a6a8-2b1c6b9d2d1a/items
Authorization: Bearer <accessToken>
```

**200 Response**

```json
[
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
]
```

### POST /wordlists/:id/items

Adds membership (idempotent).

**Request**

```http
POST /wordlists/d3c3ac3b-5f7f-47c6-a6a8-2b1c6b9d2d1a/items
Content-Type: application/json
Authorization: Bearer <accessToken>
```

```json
{
  "vocabularyId": "0b9d4e77-07d6-4b1d-9bbf-61efc5cb57ef"
}
```

**201 Response**

```json
{
  "added": true
}
```

**404 Vocabulary not found / not owned**

```json
{
  "message": "vocabulary not found",
  "error": "Not Found",
  "statusCode": 404
}
```

### DELETE /wordlists/:id/items/:vocabularyId

Removes membership (idempotent).

**Request**

```http
DELETE /wordlists/d3c3ac3b-5f7f-47c6-a6a8-2b1c6b9d2d1a/items/0b9d4e77-07d6-4b1d-9bbf-61efc5cb57ef
Authorization: Bearer <accessToken>
```

**200 Response (removed)**

```json
{
  "removed": true
}
```

**200 Response (already not in list)**

```json
{
  "removed": false
}
```






