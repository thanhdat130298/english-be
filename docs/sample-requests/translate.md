## Translate

API supports **1 word**, **phrase**, or **sentence**. Source language is always **English (EN)**. Results are cached. Use `saveToVocabulary: true` to also create a Vocabulary item (best for word/phrase).

### POST /translate (translate only)

Requires JWT.

**Request**

```http
POST /translate
Content-Type: application/json
Authorization: Bearer <accessToken>
```

```json
{
  "text": "I have been studying English for two years.",
  "targetLang": "KO"
}
```

Or a single word / phrase:

```json
{
  "text": "recommend",
  "targetLang": "VI"
}
```

**201 Response (not cached)**

```json
{
  "text": "I have been studying English for two years.",
  "targetLang": "KO",
  "detectedSourceLang": "EN",
  "translatedText": "저는 2년 동안 영어를 공부해 왔습니다.",
  "cached": false
}
```

### POST /translate (translate + save to vocabulary)

Requires JWT. Best for **1 word / phrase**.

**Request**

```http
POST /translate
Content-Type: application/json
Authorization: Bearer <accessToken>
```

```json
{
  "text": "take for granted",
  "targetLang": "VI",
  "saveToVocabulary": true,
  "vocabularyExample": "I took electricity for granted until the blackout.",
  "vocabularySourceText": "I took electricity for granted until the blackout."
}
```

**201 Response**

```json
{
  "text": "take for granted",
  "targetLang": "VI",
  "detectedSourceLang": "EN",
  "translatedText": "coi là điều hiển nhiên",
  "cached": false,
  "vocabulary": {
    "id": "0b9d4e77-07d6-4b1d-9bbf-61efc5cb57ef"
  }
}
```

**201 Response (cached)**

```json
{
  "text": "I have been studying English for two years.",
  "targetLang": "KO",
  "detectedSourceLang": "EN",
  "translatedText": "저는 2년 동안 영어를 공부해 왔습니다.",
  "cached": true
}
```

**400 Validation error (example: bad lang)**

```json
{
  "message": [
    "targetLang must be like EN or EN-US"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

**401 Unauthorized (missing/invalid token)**

```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

**502 DeepL upstream error (example)**

```json
{
  "message": {
    "message": "DeepL request failed",
    "status": 403,
    "details": "Legacy authentication method 'form body' is no longer supported..."
  },
  "error": "Bad Gateway",
  "statusCode": 502
}
```


