# BikeShare

BikeShare is a peer-to-peer motorcycle rental application for browsing verified bikes, requesting date-based rentals, coordinating in-person cash handovers, recording inspections, returning bikes, and managing disputes.

Payments are deliberately cash-only and happen directly between renter and owner. The application stores cash payment status and security-deposit status; it has no online payment processing.

## Features

- JWT authentication with renter, owner, and admin roles
- Public bike search with location, date, price, type, brand, rating, and sorting filters
- Owner bike listings, image uploads, approval workflow, and availability
- Booking requests with approval, rejection, date conflict, and lifecycle statuses
- Cash handover confirmation and one-time handover OTP
- Before/after inspection uploads and damage dispute workflow
- Security-deposit tracking and direct-cash refund status
- Reviews, notifications, reports, admin analytics, and moderation
- Responsive React UI with skeleton loading, empty states, retryable errors, and global toasts

## Architecture

This repository is a small monorepo:

```text
frontend/  React 18 + Vite + React Router + Axios
backend/   Node.js + Express + Mongoose + JWT + Multer
MongoDB    Users, bikes, bookings, payments, deposits, reviews, notifications, and moderation data
```

The frontend calls the Express API under `/api`. In development, Vite proxies `/api` to `http://localhost:5000`; production builds use `VITE_API_URL`. The backend owns authorization, booking rules, cash records, uploads, and MongoDB persistence.

## Database Schema

| Collection        | Purpose                                         | Main relationships                                      |
| ----------------- | ----------------------------------------------- | ------------------------------------------------------- |
| `User`            | Accounts and roles                              | Owns bikes, rents bikes, receives reviews/notifications |
| `Bike`            | Motorcycle listing and availability metadata    | Belongs to an owner                                     |
| `Booking`         | Rental dates, totals, OTP, and lifecycle status | Links renter, owner, and bike                           |
| `CashPayment`     | In-person cash handover record                  | Belongs to a booking                                    |
| `SecurityDeposit` | Deposit held/refunded/disputed state            | Belongs to a booking                                    |
| `Availability`    | Bike blocked dates                              | Belongs to a bike                                       |
| `Inspection`      | Before/after image evidence                     | Belongs to a booking                                    |
| `Review`          | Renter-to-owner/bike feedback                   | Belongs to a completed booking                          |
| `Notification`    | User activity messages                          | Links user and optionally booking                       |
| `Dispute`         | Damage or payment dispute state                 | Links booking and reporting user                        |
| `Report`          | User-submitted moderation report                | Targets a bike, user, or booking                        |

Booking statuses are `PENDING`, `APPROVED`, `REJECTED`, `CASH_PAYMENT_PENDING`, `CASH_PAYMENT_CONFIRMED`, `ACTIVE`, `COMPLETED`, `CANCELLED`, and `DISPUTED`.

## Setup

Prerequisites:

- Node.js 18 or newer
- npm
- MongoDB 6 or newer, local or hosted

Create local environment files from the examples. Do not commit `.env` files:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

On macOS/Linux, use `cp` instead of `copy`.

Install dependencies:

```bash
cd backend && npm install
cd ../frontend && npm install
```

## Seed Data

The demo seed is idempotent for its `@bikeshare.demo` users and `DEMO-*` bikes. It creates 10 users, 10 Indian motorcycle listings, 20 bookings, reviews, notifications, cash payments, deposits, disputes, reports, inspections, and availability records.

```bash
cd backend
npm run seed
```

The seed requires a reachable `MONGO_URI`. It prints the generated counts and the shared local demo password when complete.

## Running Locally

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`. The backend health endpoint is `GET http://localhost:5000/api/health`.

Useful checks:

```bash
cd frontend && npm run build
cd ../backend && node --check seed/seedData.js
```

## Demo Accounts

All seeded demo accounts use `BikeShare@123`. Change or remove these accounts before using a shared or production database.

| Role   | Email                    |
| ------ | ------------------------ |
| Renter | `renter1@bikeshare.demo` |
| Owner  | `owner1@bikeshare.demo`  |
| Admin  | `admin@bikeshare.demo`   |

## API Documentation

All protected endpoints use `Authorization: Bearer <jwt>`.

### Authentication

| Method | Endpoint                    | Access        |
| ------ | --------------------------- | ------------- |
| `POST` | `/api/auth/register`        | Public        |
| `POST` | `/api/auth/login`           | Public        |
| `POST` | `/api/auth/logout`          | Authenticated |
| `POST` | `/api/auth/forgot-password` | Public        |
| `POST` | `/api/auth/reset-password`  | Public        |
| `GET`  | `/api/auth/verify-email`    | Public        |

### Bikes and bookings

| Method           | Endpoint                                                                   | Access              |
| ---------------- | -------------------------------------------------------------------------- | ------------------- |
| `GET`            | `/api/bikes`, `/api/bikes/search`                                          | Public              |
| `GET`            | `/api/bikes/:id`, `/api/bikes/:id/availability`                            | Public              |
| `GET`            | `/api/bikes/my-bikes`                                                      | Owner               |
| `POST`           | `/api/bikes`                                                               | Owner               |
| `PUT` / `DELETE` | `/api/bikes/:id`                                                           | Owner               |
| `POST`           | `/api/bikes/:id/images`                                                    | Owner               |
| `POST`           | `/api/bookings`                                                            | Renter              |
| `GET`            | `/api/bookings/my-bookings`, `/api/bookings/renter/dashboard`              | Renter              |
| `GET`            | `/api/bookings/owner/requests`, `/api/bookings/owner/dashboard`            | Owner               |
| `PUT`            | `/api/bookings/:id/approve`, `/api/bookings/:id/reject`                    | Owner               |
| `POST`           | `/api/bookings/:id/confirm-cash-payment`, `/api/bookings/:id/generate-otp` | Owner               |
| `POST`           | `/api/bookings/:id/verify-otp`                                             | Renter              |
| `POST`           | `/api/bookings/:id/inspection`, `/api/bookings/:id/return`                 | Authenticated/Owner |
| `GET`            | `/api/bookings/:id/inspections`                                            | Authenticated       |

### Payments, deposits, reviews, notifications, and moderation

| Method         | Endpoint                                                                                                                                              | Access                          |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `GET`          | `/api/payments/booking/:bookingId`                                                                                                                    | Authenticated participant/admin |
| `GET`          | `/api/deposits/booking/:bookingId`                                                                                                                    | Authenticated                   |
| `PUT`          | `/api/deposits/:id/refund`                                                                                                                            | Owner                           |
| `POST`         | `/api/reviews`                                                                                                                                        | Booking participant             |
| `GET`          | `/api/reviews/bike/:bikeId`, `/api/reviews/user/:userId`, `/api/reviews/booking/:bookingId`                                                           | Public/authenticated            |
| `GET` / `PUT`  | `/api/notifications/mine`, `/api/notifications/read-all`, `/api/notifications/:id/read`                                                               | Authenticated                   |
| `POST` / `GET` | `/api/reports`, `/api/reports/my-reports`                                                                                                             | Authenticated                   |
| `GET`          | `/api/admin/stats`, `/api/admin/users`, `/api/admin/bikes`, `/api/admin/bookings`, `/api/admin/payments`, `/api/admin/disputes`, `/api/admin/reports` | Admin                           |
| `PUT`          | `/api/admin/bikes/:id/approve`, `/api/admin/bikes/:id/reject`, `/api/admin/bikes/:id/suspend`                                                         | Admin                           |
| `PUT`          | `/api/admin/disputes/:id`, `/api/admin/reports/:id`                                                                                                   | Admin                           |

## Deployment

1. Provision MongoDB and create a production database user with least-privilege access.
2. Deploy the backend as a Node.js service with `npm ci` and `npm start` from `backend/`.
3. Set `MONGO_URI`, a long random `JWT_SECRET`, `PORT`, `CLIENT_URL`, and SMTP variables in the backend environment.
4. Build the frontend with `npm ci && npm run build` from `frontend/` and serve `frontend/dist` through a static host or web server.
5. Set frontend `VITE_API_URL` to the public backend origin before building.
6. Configure CORS, HTTPS, MongoDB network access, upload storage, and log retention for the hosting platform.
7. Run `npm run seed` only against a disposable demo/staging database. Never use the published demo credentials in production.

There is no payment gateway integration in this project. Payment-related records are limited to in-person cash handover, security deposits, and dispute status.
