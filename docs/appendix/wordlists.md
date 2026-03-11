# Appendix — Wordlists

## Purpose

Allow a user to group vocabulary items into named lists to support later learning modes (focused practice, themed lists, etc.).

## Files/modules involved (planned)

- `src/wordlists/wordlists.module.ts`
- `src/wordlists/wordlists.controller.ts`
- `src/wordlists/wordlists.service.ts`
- `src/wordlists/dto/create-wordlist.dto.ts`
- `src/wordlists/dto/update-wordlist.dto.ts`
- `src/wordlists/dto/add-wordlist-item.dto.ts`

## Data models involved

- `Wordlist`
- `WordlistItem` (join table)
- `Vocabulary` (referenced)

## APIs involved (planned)

- `POST /wordlists`
- `GET /wordlists`
- `GET /wordlists/:id`
- `PATCH /wordlists/:id`
- `DELETE /wordlists/:id`
- `GET /wordlists/:id/items`
- `POST /wordlists/:id/items`
- `DELETE /wordlists/:id/items/:vocabularyId`

## Notes for future extensions

- **Ordering**: add `position` on join rows.
- **Sharing**: add visibility flags + invite/share tables.
- **Bulk ops**: add `POST /wordlists/:id/items/bulk`.


