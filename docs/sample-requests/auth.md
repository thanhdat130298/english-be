## Auth

### GET /auth/me

Requires JWT.

**Request**

```http
GET /auth/me
Authorization: Bearer <accessToken>
```

**200 Response**

```json
{
  "userId": "0cb6e6c6-4c2d-4c77-9c2b-2d5c0f4b2d4f",
  "username": "dat"
}
```

### POST /auth/register

**Request**

```http
POST /auth/register
Content-Type: application/json
```

```json
{
  "username": "dat",
  "password": "Password123!"
}
```

**201 Response**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**400 Validation error (example)**

```json
{
  "message": [
    "username must contain only letters, numbers, and underscores"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

**409 Username exists**

```json
{
  "message": "username already exists",
  "error": "Conflict",
  "statusCode": 409
}
```

### POST /auth/login

**Request**

```http
POST /auth/login
Content-Type: application/json
```

```json
{
  "username": "dat",
  "password": "Password123!"
}
```

**201 Response**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**401 Invalid credentials**

```json
{
  "message": "invalid credentials",
  "error": "Unauthorized",
  "statusCode": 401
}
```




