# Drive.net Avto Sale Platform

To'liq avto savdo platformasi: `NestJS + Prisma + PostgreSQL` backend va `React + Vite` frontend bir repoda.

## Project haqida

Bu loyiha 3 xil rol bilan ishlaydi:

- `USER`: mashinalarni ko'radi, buyurtma beradi, review yozadi, o'z buyurtma/to'lovlarini kuzatadi.
- `ADMIN`: mashina, kategoriya, installment plan, kampaniya, buyurtmalar va to'lovlarni boshqaradi.
- `SUPERADMIN`: admin imkoniyatlarining barchasi + user boshqaruvi, stats cache, admin action log.

## Nimalar qila oladi

### User flow

- Ro'yxatdan o'tish va login (`JWT` auth).
- Car listing va car detail ko'rish.
- Kategoriya bo'yicha mashinalarni ko'rish.
- Buyurtma berish:
  - `FULL_PAYMENT`
  - `INSTALLMENT`
  - `TRADE_IN`
- Review qo'shish, yangilash, o'chirish.
- O'z buyurtmalari va to'lov tarixini ko'rish.

### Admin flow

- Mashina CRUD (rasm upload bilan).
- Car category CRUD.
- Installment plan CRUD.
- Discount campaign CRUD + kampaniyaga mashina biriktirish/olib tashlash.
- Buyurtma statusini yangilash.
- Buyurtmaga to'lov kiritish.

### Superadmin flow

- Admin yaratish.
- Userlarni ko'rish, yangilash, soft delete.
- Dashboard statistikani cache bilan olish va qayta hisoblash.
- Admin action loglarni ko'rish va soft delete.
- Ilova start bo'lganda `.env` orqali superadmin auto-bootstrap.

## Texnologiyalar

### Backend

- NestJS 11
- Prisma ORM
- PostgreSQL
- JWT + Role Guards
- Swagger (`/swagger`)
- Cloudinary (image upload)

### Frontend

- React 19 + TypeScript
- Vite 8
- Zustand
- React Router
- Framer Motion
- TailwindCSS v4

## Arxitektura

Backend modullar:

- `auth`
- `user`
- `car`
- `cars-category`
- `installment-plan`
- `discount-campaign`
- `order`
- `payment`
- `review`
- `stats-cache`
- `admin-action-log`

Frontend sahifalar:

- User: car listing, car details, user dashboard
- Admin/Superadmin: dashboard, cars, categories, orders, installments, campaigns
- Superadmin only: users, analytics, action logs

## Tezkor API ko'rinish

Base URL (default): `http://localhost:3001`

Swagger: `http://localhost:3001/swagger`

Authorization:

```http
Authorization: Bearer <access_token>
```

Asosiy endpointlar:

- `POST /auth/register`
- `POST /auth/login`
- `GET /cars`
- `POST /cars/create` (ADMIN, SUPERADMIN)
- `GET /categories/all`
- `POST /categories` (ADMIN, SUPERADMIN)
- `POST /orders`
- `GET /orders/my`
- `POST /orders/:id/pay` (ADMIN, SUPERADMIN)
- `GET /payments/my`
- `POST /installment-plans` (ADMIN, SUPERADMIN)
- `POST /campaigns` (ADMIN, SUPERADMIN)
- `GET /stats` (SUPERADMIN)
- `GET /admin-logs` (SUPERADMIN)

## Local ishga tushirish

### 1) Talablar

- Node.js `>= 20`
- PostgreSQL

### 2) Backend setup

Repo rootda:

```bash
npm install
```

`.env` ni to'g'rilang:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DB_NAME?schema=public
JWT_SECRET_KEY=change_me
JWT_EXPIRES_IN=90m
PORT=3001
HOST=0.0.0.0
BCRYPT_SALT=10

SUPERADMIN_NAME=Platform Superadmin
SUPERADMIN_PHONE=+998900000001
SUPERADMIN_EMAIL=superadmin@drive.net
SUPERADMIN_PASSWORD=SuperAdmin123
SUPERADMIN_AVATAR_URL=
```

Migratsiyalarni qo'llash:

```bash
npm run db:deploy
```

Backendni ishga tushirish:

```bash
npm run start:dev
```

### 3) Frontend setup

Yangi terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend default API manzilni o'zi oladi:

- brauzer hosti + `:3001`
- agar backend reverse proxy bilan shu origin'da bo'lsa, to'g'ridan-to'g'ri shu origin

Xohlasangiz `frontend/.env` ichida override qiling:

```env
VITE_API_URL=http://localhost:3001
```

## Muhim eslatma

- Loyiha soft delete ishlatadi (`status: active/deleted/blocked`) ko'p modullarda.
- Superadmin account har safar app startida `.env` qiymatlariga ko'ra yaratiladi/yangilanadi.
- Swagger orqali endpointlarni tez test qilishingiz mumkin.
- Production uchun maxfiy qiymatlarni (`JWT`, DB, Cloudinary) albatta env/secrets orqali boshqaring.

## Scriptlar

Root (backend):

- `npm run start:dev`
- `npm run build`
- `npm run start:prod`
- `npm run db:deploy`
- `npm run test`

Frontend (`frontend/`):

- `npm run dev`
- `npm run build`
- `npm run preview`
