# NodeAuthMVC (Express + MongoDB) — Production-ready Auth & RBAC (Strict MVC, No Service Layer)

This repository implements a **production-ready authentication & authorization system** using:
- **Express**, **MongoDB (Mongoose)**
- **Email OTP verification** via **Nodemailer**
- **JWT Access + Refresh** tokens with **refresh token rotation**
- **Role-based access control** (`user`, `admin`)
- Strict **MVC** architecture: **ALL business logic is inside controllers** (no `src/services`).

## Features
- Register → send OTP to email (stored hashed)
- Verify OTP → mark email verified, issue access + refresh tokens
- Login → issue tokens (or prompt verification safely)
- Resend OTP with cooldown and DB-level throttling
- Refresh token rotation (invalidate old, store new hashed token)
- Logout (invalidate refresh token, clear cookie)
- Protected routes + admin-only routes
- Security middlewares: helmet, cors, rate-limit, mongo-sanitize, xss-clean
- Validation: Joi
- Logging: morgan + winston (structured)
- Graceful shutdown

## Quick Start

### 1) Install
```bash
npm install
```

### 2) Configure env
```bash
cp .env.example .env
# edit .env values
```

### 3) Run
```bash
npm run dev
# or
npm start
```

Server runs at: `http://localhost:5000`  
API base: `/api/v1`

## Deployment Notes
- Put the app behind **HTTPS** (required for secure cookies in browsers).
- Set:
  - `COOKIE_SECURE=true` in production (HTTPS)
  - `CORS_ORIGIN` to your frontend domain
  - `TRUST_PROXY=true` if behind a reverse proxy (NGINX/Heroku/Render/etc.)
- Use strong secrets for JWT (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`).
- Consider setting `COOKIE_DOMAIN` for subdomain cookie sharing.
- Run MongoDB with authentication + backups.
- Add monitoring/alerting and central log aggregation for production.

## API Endpoints

Base: `/api/v1`

### Auth
- `POST /auth/register`
- `POST /auth/verify-otp`
- `POST /auth/login`
- `POST /auth/resend-otp`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET  /auth/me` (protected)

### Users
- `GET /users/profile` (protected)
- `PATCH /users/profile` (protected)

### Admin
- `GET /admin/users` (admin-only)
- `PATCH /admin/users/:id/role` (admin-only)
- `PATCH /admin/users/:id/block` (admin-only)

### Health
- `GET /health`

## Postman
Import the included collection:
- `postman/NodeAuthMVC.postman_collection.json`

## Password Reset
- Forgot password sends a **one-time reset token** to email (stored hashed, expires quickly).
- Reset password invalidates all refresh tokens (logs out everywhere).

## Notes on Security Choices
- **OTP is never stored in plaintext**: only `bcrypt` hash is stored.
- **Refresh tokens are stored hashed** (SHA-256 with a pepper).
- Responses avoid user enumeration by returning **generic messages** for register/resend.
