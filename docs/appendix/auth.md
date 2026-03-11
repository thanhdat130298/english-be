# Appendix — Authentication

## Purpose

Provide username/password signup and login with JWT-based authentication to protect all user-owned resources.

## Files/modules involved (planned)

- `src/auth/auth.module.ts`
- `src/auth/auth.controller.ts`
- `src/auth/auth.service.ts`
- `src/auth/dto/register.dto.ts`
- `src/auth/dto/login.dto.ts`
- `src/auth/jwt.strategy.ts`
- `src/auth/jwt-auth.guard.ts`
- `src/auth/types/request-user.ts` (or equivalent)

## Data models involved

- `User`

## APIs involved (planned)

- `POST /auth/register`
- `POST /auth/login`

## Notes for future extensions

- **Refresh tokens**: add `refreshTokenHash` storage + rotation and `POST /auth/refresh`.
- **Password reset**: add email + reset token table.
- **Roles**: add `role` column to `User` and role guards.


