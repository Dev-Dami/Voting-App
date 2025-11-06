# Voting App

A secure, real-time voting application with admin and student interfaces.

## Features

- **Student Voting**: Secure login and voting interface
- **Admin Dashboard**: Election management and real-time results
- **Real-time Updates**: Live vote counting with Socket.IO
- **Issue Reporting**: Students can report problems to admins
- **User Management**: Admins can manage voters and reset passwords
- **Issue Tracking**: System for tracking and resolving reported issues

## Quick Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create environment file**
   ```bash
   # Create .env file with:
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/voting-app
   JWT_SECRET=your-super-secret-jwt-key-here
   SCHOOL_NAME=Your School Name
   SCHOOL_LOGO=/images/logo.png
   ```

3. **Start the application**
   ```bash
   npm start          # Production
   npm run dev       # Development
   ```

## Student Features

### Login & Voting
- **Login**: Students use their ID and password
- **Voting Interface**: Clean, mobile-friendly voting interface
- **Vote Confirmation**: Digital vote slip after voting
- **Issue Reporting**: Report problems via inline form on login page

### Issue Reporting
- Click "Report Issue" on login page
- Fill in your name, class, and problem description
- Admins receive and track issues in admin panel

## Admin Features

### Dashboard
- **Live Statistics**: Real-time election metrics
- **Election Controls**: Start, end, or reset elections
- **Candidate Management**: Add/delete candidates
- **Student Management**: Add/remove students

### Voter Management
- Access via "View All Voters & Issues" link
- View all registered voters
- Reset student passwords
- Delete student accounts
- Track and manage reported issues

### Issue Management
- View all reported issues
- Update issue status (pending, in-progress, resolved)
- Track student-reported problems

## Technical Details

### Tech Stack
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Frontend**: EJS templates + Tailwind CSS
- **Real-time**: Socket.IO
- **Authentication**: JWT tokens

### Models
- **Student**: Voter accounts with voting status
- **Candidate**: Election candidates
- **Election**: Election configuration and status
- **VoteLog**: Individual vote records
- **Issue**: User-reported problems

### Security
- Passwords hashed with bcrypt
- JWT authentication for all protected routes
- File upload validation for candidate images
- Rate limiting for vote submissions

## API Endpoints

### Admin Routes (`/admin/...`)
- `GET /dashboard` - Admin dashboard
- `GET /voters` - Voter and issue management page
- `POST /students/add` - Add new student
- `POST /students/delete/:id` - Remove student
- `POST /students/update-password/:id` - Reset student password
- `POST /candidates/add` - Add candidate
- `POST /candidates/delete/:id` - Remove candidate
- `POST /election/start` - Start election
- `POST /election/end` - End election
- `POST /election/reset` - Reset election

### Student Routes
- `GET /login` - Student login page
- `POST /login` - Student authentication
- `GET /vote` - Voting interface
- `POST /vote` - Submit vote
- `GET /slip` - Vote confirmation
- `POST /submit-issue` - Report an issue

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `SCHOOL_NAME` - School name for branding
- `SCHOOL_LOGO` - School logo path

## File Structure

```
Voting-App/
├── server.js                 # Main application
├── config/
│   └── db.js                 # Database connection
├── models/
│   ├── Student.js            # Voter model
│   ├── Candidate.js          # Candidate model
│   ├── Election.js           # Election model
│   ├── voteLogs.js           # Vote logging
│   └── Issue.js              # Issue reporting model
├── routes/
│   ├── admin.js              # Admin routes
│   └── student.js            # Student routes
├── views/
│   ├── login.ejs             # Student login
│   ├── adminDashboard.ejs    # Admin dashboard
│   └── adminVoters.ejs       # Voter management
└── public/
    ├── css/                  # Stylesheets
    ├── js/                   # Client JavaScript
    └── images/               # Assets
```

## Troubleshooting

- **Database Connection**: Ensure MongoDB is running
- **JWT Secret**: Required for authentication
- **Port Conflicts**: Check if port 5000 is available
- **File Uploads**: Candidate images directory needs write permissions

## License

[Your license information]