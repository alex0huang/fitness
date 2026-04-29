# 🏋️ Fitness Tracker

A simple, focused nutrition & meal tracking app—log every meal and make every effort count.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-19.2.0-blue.svg)

## 语言 / Language

- **English (default)**: `README.md`
- **中文**: `README.zh-CN.md`

## ✨ Features

- 📝 **Meal logging** - Track breakfast, lunch, dinner, and other meals
- 🍎 **Macro tracking** - Calories, protein, carbs, and fat
- 📊 **Daily stats** - Daily totals with progress bars
- 🎯 **Goals** - Set daily targets and track progress
- 📅 **Date filter** - Review meal logs by date
- 🔐 **Auth** - Secure signup & login (JWT)
- 📱 **Responsive UI** - Works well on desktop and mobile

## 🚀 Live

- **Frontend**: [https://fitness-eight-mocha.vercel.app](https://fitness-eight-mocha.vercel.app)
- **Backend API**: [https://fitness-yhc9.onrender.com](https://fitness-yhc9.onrender.com)

## 🛠️ Tech Stack

### Frontend
- **React 19**
- **React Router 6**
- **Vite**
- **Plain CSS** (no UI framework dependency)

### Backend
- **Express 5**
- **PostgreSQL**
- **JWT** authentication
- **bcrypt**

### Deployment
- **Vercel** (frontend)
- **Render** (backend)
- **Neon** (PostgreSQL)

## 📦 Project Structure

```
fitness/
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Pages
│   │   ├── services/      # API services
│   │   └── utils/         # Utilities
│   └── package.json
├── routes/                # Express routes
│   ├── users.js
│   ├── meals.js
│   └── admin.js
├── scripts/               # DB scripts
│   ├── migrations/        # Migrations
│   └── cleanup-old-data.js
├── database.js            # DB config/connection
├── server.js              # Express entry
└── package.json
```

## 🚀 Quick Start

### Requirements

- Node.js >= 18.0.0
- PostgreSQL >= 12.0
- npm or yarn

### Setup

1. **Clone**

```bash
git clone https://github.com/alex0huang/fitness.git
cd fitness
```

2. **Install dependencies**

```bash
# backend
npm install

# frontend
cd frontend
npm install
cd ..
```

3. **Environment variables**

Create a `.env` file (see `env.example.txt`):

```env
# DB (option 1: connection string)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# or option 2: separate vars
DB_USER=your_db_user
DB_HOST=localhost
DB_NAME=fitness
DB_PASSWORD=your_db_password
DB_PORT=5432

# app
NODE_ENV=development
SESSION_SECRET=your-session-secret
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:5173
```

4. **Initialize database**

```bash
npm run migrate
```

5. **Run dev**

```bash
# run backend + frontend together (recommended)
npm run dev
```

This starts:
- Backend: http://localhost:3000
- Frontend: http://localhost:5173

**Or run separately:**

```bash
# terminal 1
npm run devStart

# terminal 2
npm run frontend
```

## 📚 API

### Auth

All protected endpoints require a JWT token:

```
Authorization: Bearer <your-jwt-token>
```

### Users

- `POST /users` - Register
  ```json
  {
    "firstname": "name",
    "password": "password"
  }
  ```

- `POST /users/login` - Login
  ```json
  {
    "firstname": "name",
    "password": "password"
  }
  ```
  Returns: `{ "token": "jwt-token", "user": {...} }`

- `GET /users/me` - Current user (auth required)

- `PUT /users/me/goals` - Update nutrition goals (auth required)
  ```json
  {
    "daily_calorie_limit": 2600,
    "daily_protein_limit": 160,
    "daily_carbs_limit": 310,
    "daily_fat_limit": 80
  }
  ```

- `POST /users/logout` - Logout

### Meals (auth required)

- `GET /meals?date=2025-11-30` - List meals (optional date filter)
- `GET /meals/:mealId` - Meal detail

- `POST /meals` - Create meal
  ```json
  {
    "title": "Dinner",
    "consumed_at": "2025-11-30T20:00:00",
    "notes": "optional notes",
    "items": [
      {
        "food_name": "Rice",
        "calories": 200,
        "protein_grams": 5,
        "carbs_grams": 45,
        "fat_grams": 0.5
      }
    ]
  }
  ```

- `PUT /meals/:mealId` - Update meal
- `DELETE /meals/:mealId` - Delete meal

## 🏗️ Build

```bash
npm run frontend:build
```

Build output: `frontend/dist/`

## 🌐 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md).

---

⭐ If this project helps you, please consider giving it a Star!
