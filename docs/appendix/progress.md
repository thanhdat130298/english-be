# Appendix — Progress (Basic)

## Purpose

Expose minimal stats so a user can see basic learning activity without introducing SRS complexity.

## Files/modules involved (planned)

- `src/progress/progress.module.ts`
- `src/progress/progress.controller.ts`
- `src/progress/progress.service.ts`
- `src/progress/dto/progress-summary.query.dto.ts`

## Data models involved

- `Vocabulary` (counts by user and by date)

## APIs involved (planned)

- `GET /progress/summary`

## Notes for future extensions

- **Streaks**: compute daily activity streaks using user timezone.
- **SRS stats**: due cards, review counts, retention.
- **Goals**: user-configured daily/weekly targets.


