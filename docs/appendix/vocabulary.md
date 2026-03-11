# Appendix — Vocabulary

## Purpose

Allow a user to store and manage vocabulary items (word/phrase + meaning + example + source text) for later learning flows.

## Files/modules involved (planned)

- `src/vocabulary/vocabulary.module.ts`
- `src/vocabulary/vocabulary.controller.ts`
- `src/vocabulary/vocabulary.service.ts`
- `src/vocabulary/dto/create-vocabulary.dto.ts`
- `src/vocabulary/dto/update-vocabulary.dto.ts`
- `src/vocabulary/dto/list-vocabulary.query.dto.ts` (optional; Sprint 1 minimal)

## Data models involved

- `Vocabulary`

## APIs involved (planned)

- `POST /vocabulary`
- `GET /vocabulary`
- `GET /vocabulary/:id`
- `PATCH /vocabulary/:id`
- `DELETE /vocabulary/:id`

## Notes for future extensions

- **Flashcards/SRS**: add fields like `nextReviewAt`, `easeFactor`, `intervalDays`.
- **Audio/IPA**: add pronunciation fields and TTS integrations.
- **Tagging**: add many-to-many tags.


