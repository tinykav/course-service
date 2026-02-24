# 📘 Course Service

Microservice for managing the course catalog and capacity.
Part of the University Enrollment System — SE4010 Cloud Computing Assignment.

## 🛠 Tech Stack
- **Node.js 20** + **Express**
- **MongoDB Atlas** (via Mongoose)
- **Docker** + **Docker Hub**
- **GitHub Actions** CI/CD
- **Google Cloud Run** (cloud deployment)

---

## 🚀 Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Fill in MONGO_URI (from MongoDB Atlas) and JWT_SECRET

# 3. Start dev server
npm run dev

# Visit: http://localhost:3000/health
```

## 🐳 Run with Docker

```bash
docker build -t course-service .
docker run -p 3000:3000 --env-file .env course-service
```

## 🧪 Run Tests

```bash
npm test
```

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | None | Health check |
| GET | `/courses` | None | Get all courses |
| GET | `/courses/:id` | None | Get course by ID |
| POST | `/courses` | Admin JWT | Create a course |
| PUT | `/courses/:id` | Admin JWT | Update course info |
| PUT | `/courses/:id/capacity` | None | Increment/decrement capacity |

### Capacity endpoint — for Enrollment Service
```json
PUT /courses/:id/capacity
{ "action": "decrement" }   ← when student enrolls
{ "action": "increment" }   ← when enrollment is cancelled
```

---

## 🔑 GitHub Secrets Required

| Secret | Where to get it |
|--------|-----------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub → Account Settings → Security → New Token |
| `SNYK_TOKEN` | snyk.io → free account → API Token |
| `GCP_SA_KEY` | GCP → IAM → Service Accounts → Create Key (JSON) |
| `MONGO_URI` | MongoDB Atlas → Connect → Drivers |
| `JWT_SECRET` | Any strong secret string you choose |

---

## ☁️ Setup Guide

### 1. MongoDB Atlas (Free)
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → sign up free
2. Create a free **M0 cluster**
3. Go to **Database Access** → Add a user with password
4. Go to **Network Access** → Add IP `0.0.0.0/0` (allow all — fine for assignment)
5. Go to **Connect** → Drivers → copy the connection string
6. Replace `<password>` with your user's password → save as `MONGO_URI` secret

### 2. Docker Hub
1. Sign up at [hub.docker.com](https://hub.docker.com)
2. Go to **Account Settings → Security → New Access Token**
3. Add as `DOCKERHUB_TOKEN` secret in GitHub

### 3. Google Cloud Run (Free Tier)
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create a project
2. Enable **Cloud Run API** and **IAM API**
3. Go to **IAM → Service Accounts → Create Service Account**
4. Grant roles: `Cloud Run Admin` + `Service Account User`
5. Click the account → **Keys → Add Key → JSON** → download
6. Copy the entire JSON content → paste as `GCP_SA_KEY` secret in GitHub
7. That's it — the pipeline deploys automatically on every push to `main`!
