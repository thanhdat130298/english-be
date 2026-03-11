# Appendix — Translation (DeepL + cache)

## Purpose

Translate **1 word, phrase, or sentence** server-side using DeepL; reuse cached translations from PostgreSQL; optionally save the result as a Vocabulary item for the authenticated user.

## Behaviour

- **Input**: `text` (word/phrase/sentence) + `targetLang` (+ optional `sourceLang`, `saveToVocabulary`, `vocabularyWord`, `vocabularyExample`, `vocabularySourceText`).
- **Cache**: Global `TranslationCache` by (normalizedText, sourceLang, targetLang). No user data in cache.
- **Save to Vocabulary**: If `saveToVocabulary=true`, a `Vocabulary` row is created: `word` = `vocabularyWord` or `text` (must be ≤128 chars), `meaning` = translated text.

## Files involved

- `src/translate/translate.module.ts`
- `src/translate/translate.controller.ts`
- `src/translate/translate.service.ts`
- `src/translate/dto/translate.dto.ts`

## Data models involved

- `TranslationCache` (global cache)
- `Vocabulary` (user-owned, when saveToVocabulary=true)

## APIs involved

- `POST /translate` (JWT required)

## Notes for future extensions

- **Provider abstraction**: support Gemini translate or alternative providers behind interface.
- **Advanced DeepL options**: formal/informal, glossary, context parameters.
- **Rate limiting**: per-user quotas to protect API spend.


