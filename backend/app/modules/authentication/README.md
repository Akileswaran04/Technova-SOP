# Authentication Module

**Status: NOT IMPLEMENTED**

## Planned Responsibilities
- User registration and login
- JWT token management
- OAuth2 integration (Google, GitHub)
- Password reset flow
- Email verification
- RBAC middleware

## Planned Database
- `users` (shared with seller_profile)
- `oauth_connections`
- `email_verifications`
- `password_resets`

## Dependencies
- `python-jose` for JWT
- `passlib` with bcrypt for password hashing
- `authlib` for OAuth2
