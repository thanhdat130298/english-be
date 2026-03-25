# Hướng dẫn tích hợp Frontend (API contract)

Tài liệu để team **FE** ráp UI/API: base URL, header, từng endpoint, body/query, response, lỗi thường gặp.  
Chi tiết đầy đủ + “Try it out” có tại **Swagger**: `{BACKEND_ORIGIN}/api/swagger`.

---

## 2. Luồng auth (tối thiểu)

1. `POST /api/auth/register` hoặc `POST /api/auth/login` → nhận `{ accessToken: string }`.
2. Lưu token (memory / `localStorage` / cookie — tuỳ chính sách bảo mật).
3. Mọi request protected: gửi `Authorization: Bearer <accessToken>`.
4. (Tuỳ chọn) `GET /api/auth/me` để lấy `{ userId, username }` sau khi load app.

**401**: thiếu token, token hết hạn, hoặc user đã bị xóa — FE nên đăng xuất / redirect login.

---

## 3. Bảng endpoint (ráp nhanh)

Cột **Auth**: `JWT` = cần Bearer token; `-` = public.

| Method | Path | Auth | Mô tả ngắn |
|--------|------|------|------------|
| GET | `/api` | - | Health/hello (string) |
| POST | `/api/auth/register` | - | Đăng ký |
| POST | `/api/auth/login` | - | Đăng nhập |
| GET | `/api/auth/me` | JWT | User hiện tại |
| PATCH | `/api/auth/password` | JWT | Đổi mật khẩu |
| PATCH | `/api/auth/reset-password` | JWT | Reset về mặc định `Password1234%` (**tạm ẩn nút trên UI**) |
| POST | `/api/feedback` | JWT | Gửi feedback (giới hạn 5/ngày, tối đa 20/user) |
| GET | `/api/feedback/mine` | JWT | Danh sách feedback của user hiện tại |
| POST | `/api/translate` | JWT | Dịch + optional lưu vocabulary |
| GET | `/api/vocab/review-queue` | JWT | Tối đa 20 từ chưa archive (học ngay khi có từ) |
| GET | `/api/vocab` | JWT | Danh sách vocabulary (phân trang + filter) |
| GET | `/api/vocabulary` | JWT | **Alias** giống `/api/vocab` |
| POST | `/api/vocab` | JWT | Tạo vocabulary |
| POST | `/api/vocabulary` | JWT | Alias |
| GET | `/api/vocab/:id` | JWT | Chi tiết theo id (UUID) |
| PATCH | `/api/vocab/:id` | JWT | Sửa word/meaning/example/sourceText |
| PATCH | `/api/vocab/:id/review` | JWT | Gửi kết quả ôn: HARD / MEDIUM / EASY |
| PATCH | `/api/vocab/:id/archive` | JWT | Ẩn (archive) |
| DELETE | `/api/vocab/:id` | JWT | Giống archive (soft) |
| POST | `/api/wordlists` | JWT | Tạo wordlist |
| GET | `/api/wordlists` | JWT | Danh sách wordlist |
| GET | `/api/wordlists/:id` | JWT | Chi tiết wordlist |
| PATCH | `/api/wordlists/:id` | JWT | Cập nhật |
| DELETE | `/api/wordlists/:id` | JWT | Xóa wordlist |
| GET | `/api/wordlists/:id/items` | JWT | Các vocabulary trong list |
| POST | `/api/wordlists/:id/items` | JWT | Thêm vocabulary vào list |
| DELETE | `/api/wordlists/:id/items/:vocabularyId` | JWT | Gỡ khỏi list |
| GET | `/api/progress/summary` | JWT | Thống kê (query `date` optional) |
| GET | `/api/progress/dashboard` | JWT | Dữ liệu dashboard progress (chart/streak/activity/wordlists) |
| GET | `/api/progress/leaderboard` | JWT | Bảng xếp hạng user theo tổng số từ đã lưu |
| DELETE | `/api/admin/data` | JWT | Xóa data (trừ user) — chỉ dev/test |

---

## 4. Body & query chính

### 4.1 `POST /api/auth/register` | `POST /api/auth/login`

```json
{
  "username": "string (3-32, [a-zA-Z0-9_])",
  "password": "string (8-72)"
}
```

**Response 201**

```json
{ "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

**409** (register): username đã tồn tại.

---

### 4.2 `GET /api/auth/me`

**Response 200**

```json
{
  "userId": "uuid",
  "username": "string"
}
```

---

### 4.2b `PATCH /api/auth/password`

```json
{
  "currentPassword": "string (8-72)",
  "newPassword": "string (8-72)"
}
```

**Response 200**

```json
{ "updated": true }
```

**401**: token không hợp lệ hoặc `currentPassword` sai.

**FE UI flow (đã chốt):**
- Click **Change Password** -> mở modal.
- Form gồm: `currentPassword`, `newPassword`, `confirmPassword`.
- Validate FE: `newPassword === confirmPassword` trước khi gọi API.
- Nút submit: **Update Password** -> gọi `PATCH /api/auth/password` với body chỉ gồm `currentPassword`, `newPassword`.

---

### 4.2c `PATCH /api/auth/reset-password`

Không cần body.

**Response 200**

```json
{ "updated": true }
```

Sau khi gọi thành công, mật khẩu được reset về: `Password1234%`.

**Lưu ý FE:** tạm thời **ẩn nút Reset Password** trên giao diện. Endpoint vẫn giữ để dùng nội bộ/dev khi cần.

---

### 4.2d `POST /api/feedback`

```json
{
  "message": "string (1-2000)"
}
```

**Response 201**: object feedback vừa tạo.

```json
{
  "id": "uuid",
  "userId": "uuid",
  "message": "Nội dung feedback",
  "createdAt": "2026-02-23T10:00:00.000Z",
  "updatedAt": "2026-02-23T10:00:00.000Z"
}
```

**Giới hạn backend (hard limit):**
- Mỗi user tối đa **5 feedback/ngày** (UTC).
- Mỗi user tối đa **20 feedback tổng cộng**.

Khi vượt limit: **400** với message tương ứng.

---

### 4.2e `GET /api/feedback/mine`

**Response 200**: mảng feedback của user hiện tại, sắp xếp `createdAt desc`.

---

### 4.3 `POST /api/translate`

```json
{
  "text": "string (1-5000, trim)",
  "targetLang": "VI",
  "saveToVocabulary": false,
  "vocabularyWord": "optional, max 128",
  "vocabularyExample": "optional, max 512",
  "vocabularySourceText": "optional, max 5000"
}
```

- `targetLang`: format `^[A-Z]{2}(-[A-Z]{2})?$` (ví dụ `VI`, `EN-US`).
- `saveToVocabulary`: **`false`** = chỉ dịch, **không** tạo vocabulary; **`true`** hoặc **bỏ field** = có thể tạo/ghi vocabulary (xem logic server).

**Response 200/201** (rút gọn)

```json
{
  "text": "normalized lower text",
  "sourceLang": "EN",
  "targetLang": "VI",
  "detectedSourceLang": "EN",
  "translatedText": "string",
  "cached": true,
  "dictionary": [ {} ],
  "vocabulary": { "id": "uuid" }
}
```

- `dictionary`: mảng entry dictionary (có thể `null`/thiếu).
- `vocabulary`: chỉ khi đã lưu vocabulary.

---

### 4.4 `GET /api/vocab` (list)

**Query (tất cả optional)**

| Param | Kiểu | Mô tả |
|-------|------|--------|
| `page` | number | Mặc định 1 |
| `limit` | number | Mặc định 20, max **100** |
| `search` | string | Tìm trong word / meaning |
| `difficulty` | `EASY` \| `MEDIUM` \| `HARD` | Lọc |
| `isDue` | `true` \| `false` | Đến hạn ôn (`nextReviewAt <= now`) |
| `isNew` | `true` \| `false` | Chưa review (`reviewCount === 0`) |
| `includeArchived` | `true` \| `false` | Mặc định chỉ item chưa archive |

**Response 200**

```json
{
  "items": [ "VocabItem" ],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

**Shape `VocabItem` (mỗi phần tử)**

| Field | Kiểu | Ghi chú |
|-------|------|---------|
| `id` | string (uuid) | |
| `userId` | string | |
| `word` | string | |
| `meaning` | string | |
| `example` | string \| null | |
| `sourceText` | string \| null | |
| `difficulty` | `EASY` \| `MEDIUM` \| `HARD` \| null | |
| `reviewCount` | number | |
| `correctCount` | number | |
| `lastReviewedAt` | string (ISO) \| null | |
| `nextReviewAt` | string (ISO) \| null | |
| `isArchived` | boolean | |
| `createdAt` / `updatedAt` | string (ISO) | |
| **`isNew`** | boolean | **Derived**: `reviewCount === 0` |
| **`isDue`** | boolean | **Derived**: có `nextReviewAt` và `<= now` |
| **`isMastered`** | boolean | **Derived**: `correctCount >= 5` && `difficulty === EASY` |
| **`dictionary`** | array \| null | Full meaning từ cache (có thể null) |

---

### 4.5 `GET /api/vocab/review-queue`

**Response 200**: `VocabItem[]` (giống phần tử trong list; có `dictionary` khi có cache).

---

### 4.6 `POST /api/vocab`

```json
{
  "word": "string (1-128)",
  "meaning": "string (1-512)",
  "example": "optional max 512",
  "sourceText": "optional max 5000"
}
```

Trùng từ (cùng user, không phân biệt hoa thường) → trả bản ghi sẵn có (201/200 tùy Nest; luôn có body object).

---

### 4.7 `PATCH /api/vocab/:id/review`

```json
{ "result": "HARD" }
```

`result` ∈ **`HARD`** | **`MEDIUM`** | **`EASY`**.

**400** nếu đã archive.

---

### 4.8 `PATCH /api/vocab/:id/archive` | `DELETE /api/vocab/:id`

Trả về object vocabulary sau khi `isArchived: true` (không phải `{ deleted: true }`).

---

### 4.9 `GET /api/progress/summary`

Query optional: `date=YYYY-MM-DD` (UTC day).

**Response 200**

```json
{
  "date": "2026-03-23",
  "totalVocabularyCount": 12,
  "dailyAddedVocabularyCount": 3
}
```

---

### 4.10 `GET /api/progress/dashboard`

Query optional:
- `from=YYYY-MM-DD`
- `to=YYYY-MM-DD`

Mặc định khi không truyền query: lấy 7 ngày gần nhất đến hôm nay (UTC).

**Response 200**

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

---

### 4.11 `GET /api/progress/leaderboard`

Query optional:
- `limit` (1-100, mặc định 10)

**Response 200**

```json
{
  "topStreakUsers": [
    { "userId": "sample-1", "username": "alice", "value": 32 }
  ],
  "topAddedUsers": [
    { "userId": "sample-4", "username": "david", "value": 180 }
  ],
  "topReviewUsers": [
    { "userId": "sample-7", "username": "grace", "value": 420 }
  ],
  "topTranslatedWords": [
    { "userId": "word-1", "username": "practice", "value": 48 }
  ]
}
```

Khi hệ thống chưa có dữ liệu leaderboard thực tế, BE trả fallback sample cùng shape để FE render ổn định.

---

## 5. Lỗi chuẩn (Nest)

| HTTP | Khi nào |
|------|---------|
| **400** | Validation (body/query không hợp lệ) — `message` có thể là mảng string |
| **401** | Thiếu/sai JWT |
| **404** | Resource không tồn tại hoặc không thuộc user |
| **409** | Conflict (vd. đăng ký trùng username) |
| **502** | DeepL / upstream lỗi (translate) |

Ví dụ 400:

```json
{
  "statusCode": 400,
  "message": ["targetLang must be like EN or EN-US"],
  "error": "Bad Request"
}
```

---

## 6. Gợi ý ráp FE

1. **Axios instance**: `baseURL = VITE_API_BASE_URL`, interceptor gắn `Authorization` từ store.
2. **401**: clear token + redirect `/login`.
3. **List vocabulary**: dùng `page` + `limit` (chuẩn duy nhất).
4. **Ôn tập**: lấy `GET /api/vocab/review-queue` → hiển thị card → `PATCH .../review` với `result`.
5. **Progress page**: dùng `GET /api/progress/dashboard` thay dữ liệu hardcoded.
6. **Swagger**: mở `/api/swagger` để xem schema đồng bộ với code (DTO).

---

## 7. File liên quan trong repo

| File | Nội dung |
|------|----------|
| [sample-requests/README.md](./sample-requests/README.md) | Index + link các file mẫu curl |
| [sample-requests/vocabulary.md](./sample-requests/vocabulary.md) | Chi tiết vocabulary |
| [sample-requests/vocab-learning.md](./sample-requests/vocab-learning.md) | Review / queue / mastered |

*(Cập nhật khi API thay đổi — ưu tiên đối chiếu Swagger + source `src/**/*.controller.ts`.)*
