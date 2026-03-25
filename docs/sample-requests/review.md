## Review Vocabulary (SRS)

JWT bắt buộc.

Feature review gồm 2 endpoint:
- `GET /api/vocab/review-queue`
- `PATCH /api/vocab/:id/review`

---

### GET /api/vocab/review-queue

Trả về danh sách từ để học ngay khi có từ:
- `isArchived = false`
- sắp xếp `createdAt` giảm dần (mới nhất trước)
- tối đa `20` items

**Request**

```http
GET /api/vocab/review-queue
Authorization: Bearer <accessToken>
```

**200 Response (ví dụ)**

```json
[
  {
    "id": "0b9d4e77-07d6-4b1d-9bbf-61efc5cb57ef",
    "word": "serendipity",
    "meaning": "the occurrence of events by chance in a happy way",
    "difficulty": "MEDIUM",
    "reviewCount": 3,
    "correctCount": 2,
    "lastReviewedAt": "2026-03-21T09:00:00.000Z",
    "nextReviewAt": "2026-03-23T09:00:00.000Z",
    "isArchived": false,
    "isNew": false,
    "isDue": true,
    "isMastered": false,
    "dictionary": []
  }
]
```

---

### PATCH /api/vocab/:id/review

Gửi kết quả review cho 1 từ.

**Request**

```http
PATCH /api/vocab/0b9d4e77-07d6-4b1d-9bbf-61efc5cb57ef/review
Content-Type: application/json
Authorization: Bearer <accessToken>
```

```json
{ "result": "HARD" }
```

`result` chỉ nhận:
- `HARD`
- `MEDIUM`
- `EASY`

**Rule SRS hiện tại**
- `HARD`: `difficulty=HARD`, `reviewCount+1`, `correctCount` giữ nguyên, `nextReviewAt = now + 1 day`
- `MEDIUM`: `difficulty=MEDIUM`, `reviewCount+1`, `correctCount+1`, `nextReviewAt = now + 3 days`
- `EASY`: `difficulty=EASY`, `reviewCount+1`, `correctCount+1`, `nextReviewAt = now + 5~7 days`

Luôn update:
- `lastReviewedAt = now`

**200 Response**

Trả lại object vocabulary đã update (kèm `isNew`, `isDue`, `isMastered`).

---

### Derived states (không lưu DB)

- `isNew`: `reviewCount === 0`
- `isDue`: `nextReviewAt != null && nextReviewAt <= now`
- `isMastered`: `correctCount >= 5 && difficulty === EASY`

---

### Lỗi thường gặp

- `400`:
  - body không hợp lệ (`result` sai format)
  - review từ đã archive (`cannot review archived vocabulary`)
- `401`: thiếu/sai JWT
- `404`: vocabulary không tồn tại hoặc không thuộc user
