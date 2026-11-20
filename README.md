# UPONTIK — REST API & Ledger Server (Backend)

High-performance, secure Node.js + Express + TypeScript backend server for the UPONTIK artisan luxury e-commerce platform.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB Atlas with Mongoose ORM
- **Authentication**: JWT & secure HTTP-only cookies
- **Security**: Helmet, CORS, centralized validation & error handling

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.pd3ampt.mongodb.net/upontik?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
ADMIN_NAME="UPONTIK Master Administrator"
ADMIN_EMAIL=admin@upontik.com
ADMIN_PASSWORD=YourSecureAdminPassword
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build & Run Production
```bash
npm run build
npm run start
```

## API Highlights
- `GET /api/health` — Health check endpoint
- `POST /api/auth/register` & `POST /api/auth/login` — Authentication
- `GET /api/products` & `GET /api/categories` — Product catalog
- `POST /api/checkout` — Authoritative DB stock and pricing validation
- `GET /api/account/orders` — Customer order history and live tracking
- `PATCH /api/admin/orders/:id` — Admin order status advancement & courier tracking
