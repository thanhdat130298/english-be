## Feedback

JWT bắt buộc.

### POST /api/feedback

Gửi feedback mới.

**Giới hạn:**
- Tối đa **5 feedback/ngày** (UTC) cho mỗi user
- Tối đa **20 feedback** tổng cộng cho mỗi user

**Request**

```http
POST /api/feedback
Content-Type: application/json
Authorization: Bearer <accessToken>
```

```json
{
  "message": "App rất hữu ích, mong có thêm thống kê theo tuần."
}
```

**201 Response**

```json
{
  "id": "7b1e7e6e-3dc5-4ee9-9ca0-9bc7cd6aa8b2",
  "userId": "0cb6e6c6-4c2d-4c77-9c2b-2d5c0f4b2d4f",
  "message": "App rất hữu ích, mong có thêm thống kê theo tuần.",
  "createdAt": "2026-02-23T10:00:00.000Z",
  "updatedAt": "2026-02-23T10:00:00.000Z"
}
```

**400** (vượt limit)

```json
{
  "message": "feedback daily limit reached: max 5 per day",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### GET /api/feedback/mine

Lấy danh sách feedback của user hiện tại (mới nhất trước).

**Request**

```http
GET /api/feedback/mine
Authorization: Bearer <accessToken>
```

**200 Response**

```json
[
  {
    "id": "7b1e7e6e-3dc5-4ee9-9ca0-9bc7cd6aa8b2",
    "userId": "0cb6e6c6-4c2d-4c77-9c2b-2d5c0f4b2d4f",
    "message": "App rất hữu ích, mong có thêm thống kê theo tuần.",
    "createdAt": "2026-02-23T10:00:00.000Z",
    "updatedAt": "2026-02-23T10:00:00.000Z"
  }
]
```
