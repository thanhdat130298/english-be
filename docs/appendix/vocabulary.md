# Appendix — Vocabulary & learning

## Purpose

Lưu từ/cụm + nghĩa cho từng user; hỗ trợ **ôn tập** (review), **hàng đợi due**, **archive** (soft delete), và **dictionary** từ Free Dictionary API (cache).

## Files/modules

- `src/vocabulary/vocabulary.module.ts`
- `src/vocabulary/vocabulary.controller.ts` — `@Controller(['api/vocab', 'vocabulary'])`
- `src/vocabulary/vocabulary.service.ts`
- `src/vocabulary/vocab-derivation.ts` — `isNew` / `isDue` / `isMastered`
- `src/vocabulary/vocab-learning-defaults.ts` — `nextReviewAt` ban đầu, bước SRS
- `src/vocabulary/dto/*.ts`

## Data model (Prisma)

- `Vocabulary`: `word`, `meaning`, `example`, `sourceText`, `difficulty`, `reviewCount`, `correctCount`, `lastReviewedAt`, `nextReviewAt`, `isArchived`, …

## APIs (tóm tắt)

- List / CRUD / review / archive / review-queue — xem `docs/sample-requests/vocabulary.md` và `vocab-learning.md`.

## Notes / mở rộng sau

- Full SRS (SM-2, ease factor): có thể mở rộng từ `nextReviewAt` + `difficulty` hiện tại.
- Audio / IPA: thêm field hoặc link từ `dictionary`.
- Phân quyền admin: endpoint `DELETE /admin/data` hiện chỉ cần JWT.
