 # Yeshua School — Voting App

An in-house voting system maintained for Yeshua School. This concise, secure application provides separate admin and student interfaces and is built with Node.js, Express, MongoDB (Mongoose) and EJS templates. It is intended for school elections and similar small-to-medium use cases.

## Highlights
- Secure student authentication and voting
- Admin dashboard for election, candidate and voter management
- Real-time vote updates (Socket.IO)
- Issue reporting and basic issue tracking
## Quick Start

Requirements:
- Node.js (LTS)
- MongoDB (local or hosted)

Install dependencies:
```powershell
npm install
```

Create a `.env` file in the project root (example values):
```powershell
PORT=5000
MONGODB_URI=mongodb://localhost:27017/voting-app
JWT_SECRET=your-super-secret-jwt-key
SCHOOL_NAME="Your School Name"
SCHOOL_LOGO=/images/logo.png
```

Run in development:
```powershell
npm run dev
```

Run in production:
```powershell
npm start
```

Open http://localhost:5000 (or the `PORT` you configured).

## What’s included
- `server.js` — app entry point
- `config/` — database and helper config
- `models/` — Mongoose models (Student, Candidate, Election, VoteLog, Issue)
- `routes/` — Express routes (`admin.js`, `student.js`)
- `views/` — EJS templates
- `public/` — static assets (css, js, images)

## Core API (overview)

Admin (protected)
- GET `/admin/dashboard` — Admin dashboard view
- GET `/admin/voters` — Voter & issue management view
- POST `/admin/students/add` — Add student
- POST `/admin/students/delete/:id` — Delete student
- POST `/admin/students/update-password/:id` — Reset student password
- POST `/admin/candidates/add` — Add candidate (multipart image)
- POST `/admin/candidates/delete/:id` — Remove candidate
- POST `/admin/election/start` — Start election
- POST `/admin/election/end` — End election
- POST `/admin/election/reset` — Reset election

Student
- GET `/login` — Login form
- POST `/login` — Authenticate student
- GET `/vote` — Voting UI (requires active election)
- POST `/vote` — Submit vote
- GET `/slip` — Vote confirmation
- POST `/submit-issue` — Report an issue

Note: Some routes render EJS views while others perform actions. Protected routes use JWT/session middleware.

## Security notes
- Passwords should be hashed with bcrypt.
- Keep `JWT_SECRET` secret and strong.
- Validate uploaded images (type & size) and ensure `public/candidatesUpload/` is writable.
- Consider rate-limiting voting endpoints to prevent abuse.

## Troubleshooting
- MongoDB connection errors: ensure MongoDB is running and `MONGODB_URI` is correct.
- JWT/auth issues: confirm `JWT_SECRET` is set.
- Port in use: change `PORT` or stop the conflicting service.

## Maintainers & support

This repository is maintained for Yeshua School. If you are a maintainer or school IT staff, please update the contact details below.

- Maintainer: Dev-Dami (repo owner)
- School: Yeshua School
- Contact: yeshua

## Next steps

For more detailed architecture, tests, or deployment scripts, tell me what you'd like next. I can also add a `.env.example`, CI checks, or a formal `CODE_OF_CONDUCT.md` on request.