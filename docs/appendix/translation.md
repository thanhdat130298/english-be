# Appendix — Translation (DeepL + cache + dictionary)

## Purpose

Dịch **từ / cụm / cây** từ **tiếng Anh** sang `targetLang` (DeepL); cache **TranslationCache**; cache **DictionaryCache** từ Free Dictionary API; tùy chọn **lưu Vocabulary** với trạng thái learning ban đầu.

## Behaviour

- **Input**: `text`, `targetLang`, và tùy chọn `saveToVocabulary`, `vocabularyWord`, `vocabularyExample`, `vocabularySourceText`.
- **Source language**: luôn EN trong service (không nhận `sourceLang` từ client cho luồng dịch chính).
- **Dictionary**: `GET https://api.dictionaryapi.dev/api/v2/entries/en/<word>` → cache; response trả về mảng đã **lọc** theo đúng từ (tránh homograph như “hi” vs “high”).
- **Translation cache**: theo `normalizedText` + `sourceLang` + `targetLang` (và tương thích bản cũ `sourceLang` null).
- **Save to Vocabulary**: khi bật, upsert theo `userId` + word (case-insensitive); record mới có `reviewCount`, `correctCount`, `nextReviewAt` theo `vocab-learning-defaults`.

## Files involved

- `src/translate/translate.module.ts`
- `src/translate/translate.controller.ts`
- `src/translate/translate.service.ts`
- `src/translate/dto/translate.dto.ts`
- `src/vocabulary/vocab-learning-defaults.ts` (khi tạo vocab từ translate)

## Data models

- `TranslationCache`, `DictionaryCache`, `Vocabulary`

## API

- `POST /translate` (JWT)

## Future extensions

- Provider abstraction (Gemini, v.v.)
- Rate limiting per user
- DeepL glossary / formality
