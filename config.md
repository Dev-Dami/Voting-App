# Voting App Configuration Guide

## Overview

This is a full-stack voting application built with Node.js, Express.js, MongoDB, and EJS templating. The application provides separate interfaces for students (voters) and administrators, with real-time updates using Socket.IO.

## Project Structure

```
Voting-App/
├── server.js                 # Main application entry point
├── package.json              # Dependencies and scripts
├── config/
│   └── db.js                 # MongoDB connection configuration
├── models/                   # Database models
│   ├── Student.js            # Student/voter model
│   ├── Candidate.js          # Candidate model
│   ├── Election.js           # Election configuration model
│   └── voteLogs.js           # Vote logging model
├── routes/                   # API routes
│   ├── admin.js              # Admin-specific routes
│   └── student.js            # Student/voter routes
├── middleware/
│   └── auth.js               # JWT authentication middleware
├── views/                    # EJS templates
│   ├── homePage.ejs          # Landing page
│   ├── login.ejs             # Student login
│   ├── adminSecret.ejs       # Admin login
│   ├── adminDashboard.ejs    # Admin control panel
│   ├── vote.ejs              # Voting interface
│   ├── slip.ejs              # Vote confirmation
│   └── [other views...]
├── public/                   # Static assets
│   ├── css/                  # Stylesheets
│   ├── js/                   # Client-side JavaScript
│   ├── images/               # Images and logos
│   └── candidatesUpload/     # Candidate photos
└── node_modules/             # Dependencies
```

## Technology Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **Socket.IO** - Real-time communication
- **Multer** - File upload handling
- **bcrypt** - Password hashing

### Frontend

- **EJS** - Template engine
- **Tailwind CSS** - Styling framework
- **Chart.js** - Data visualization
- **AOS** - Animation library
- **Vanilla JavaScript** - Client-side logic

### Security & Performance

- **Helmet** - Security headers
- **Express Rate Limit** - Rate limiting
- **Cookie Parser** - Cookie handling

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/voting-app

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# School Branding (Optional)
SCHOOL_NAME=Yeshua High School
SCHOOL_LOGO=/images/logo.png
```

## Database Models

### Student Model

```javascript
{
  studentId: String,        // Unique student identifier
  password: String,         // Hashed password
  role: String,            // "student" or "teacher"
  hasVoted: Boolean,       // Voting status
  votedPositions: Array    // Array of voted positions
}
```

### Candidate Model

```javascript
{
  name: String,            // Candidate name
  position: String,        // Election position
  customPosition: String,  // Custom position name
  votes: Number,          // Vote count
  image: String           // Image path
}
```

### Election Model

```javascript
{
  name: String,           // Election name
  status: String,         // "pending", "running", "ended"
  startTime: Date,        // Election start time
  endTime: Date          // Election end time
}
```

### VoteLog Model

```javascript
{
  studentId: ObjectId,    // Reference to Student
  candidateId: ObjectId,  // Reference to Candidate
  position: String,       // Position voted for
  timestamps: true        // Created/updated timestamps
}
```

## API Endpoints

### Admin Routes (`/admin`)

| Method | Endpoint                    | Description          | Auth Required |
| ------ | --------------------------- | -------------------- | ------------- |
| GET    | `/login`                    | Admin login page     | No            |
| POST   | `/login`                    | Admin authentication | No            |
| GET    | `/dashboard`                | Admin dashboard      | Yes           |
| POST   | `/logout`                   | Admin logout         | Yes           |
| POST   | `/students/add`             | Add new student      | Yes           |
| POST   | `/students/delete/:id`      | Delete student       | Yes           |
| POST   | `/candidates/add`           | Add new candidate    | Yes           |
| POST   | `/candidates/delete/:id`    | Delete candidate     | Yes           |
| POST   | `/election/start`           | Start election       | Yes           |
| POST   | `/election/end`             | End election         | Yes           |
| POST   | `/election/reset`           | Reset election data  | Yes           |
| GET    | `/candidate/:id/votes`      | View candidate votes | Yes           |
| GET    | `/position/:position/chart` | Position chart data  | Yes           |

### Student Routes (`/`)

| Method | Endpoint  | Description            | Auth Required |
| ------ | --------- | ---------------------- | ------------- |
| GET    | `/`       | Home page              | No            |
| GET    | `/login`  | Student login page     | No            |
| POST   | `/login`  | Student authentication | No            |
| GET    | `/vote`   | Voting interface       | Yes           |
| POST   | `/vote`   | Submit vote            | Yes           |
| GET    | `/slip`   | Vote confirmation      | Yes           |
| POST   | `/logout` | Student logout         | Yes           |

## Authentication System

### JWT Token Structure

```javascript
{
  id: ObjectId,        // Student ID (for students)
  role: String,        // "admin" or "student"
  iat: Number,         // Issued at
  exp: Number          // Expiration time
}
```

### Authentication Flow

1. **Admin Login**: Uses secret key from environment variables
2. **Student Login**: Uses studentId and password
3. **Token Storage**: JWT stored in HTTP-only cookies
4. **Token Validation**: Middleware verifies tokens on protected routes

## Real-time Features

### Socket.IO Events

- **`voteUpdate`**: Emitted when a vote is cast, updates candidate vote counts
- **`newVoteLog`**: Emitted when a new vote is logged, updates admin dashboard

### Real-time Updates

- Admin dashboard shows live vote counts
- Vote logs update in real-time
- Election status changes are reflected immediately

## Security Features

### Rate Limiting

- Vote submissions: 5 attempts per minute
- Login attempts: Protected by rate limiting

### Security Headers

- Helmet.js provides security headers
- Content Security Policy enabled
- HSTS disabled for development

### File Upload Security

- Candidate images stored in `/public/candidatesUpload/`
- File access restricted to authenticated users
- Referer header validation for image access

## Available Positions

The system supports the following predefined positions:

- Head Boy
- Head Girl
- Sports Prefect
- Library Prefect
- Laboratory Prefect
- Time Keeper
- Dining-hall Prefect
- Labour Prefect
- Social Prefect
- Custom (with custom position name)

## Installation & Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Setup**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**

   - Ensure MongoDB is running
   - Update `MONGODB_URI` in `.env`

4. **Start Development Server**

   ```bash
   npm run dev
   ```

5. **Start Production Server**
   ```bash
   npm start
   ```

## Development Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## File Upload Configuration

### Multer Configuration

- **Destination**: `public/candidatesUpload/`
- **Filename**: `image-{timestamp}.{extension}`
- **File Types**: Images (jpg, png, gif, etc.)

### Image Handling

- Default candidate image: `/images/default-candidate.jpg`
- Image cleanup on candidate deletion
- Secure image serving with authentication

## Frontend Assets

### CSS Framework

- **Tailwind CSS** - Utility-first CSS framework
- **Custom Styles** - Additional styling in `/public/css/`
- **Responsive Design** - Mobile-first approach

### JavaScript Libraries

- **Chart.js** - For data visualization
- **AOS** - Animation on scroll
- **Socket.IO Client** - Real-time communication

## Deployment Considerations

### Environment Variables

- Set `NODE_ENV=production` for production
- Use strong `JWT_SECRET` in production
- Configure proper `MONGODB_URI` for production database

### Security

- Enable HTTPS in production
- Configure proper CORS settings
- Set up proper rate limiting
- Use environment-specific security headers

### Performance

- Enable MongoDB connection pooling
- Configure proper caching headers
- Optimize static asset delivery
- Monitor memory usage and database connections

## Troubleshooting

### Common Issues

1. **MongoDB Connection**: Ensure MongoDB is running and accessible
2. **JWT Secret**: Must be set in environment variables
3. **File Uploads**: Check directory permissions for `/public/candidatesUpload/`
4. **Socket.IO**: Ensure WebSocket connections are not blocked

### Logs

- Server logs are output to console
- Database connection errors are logged
- Authentication failures are logged
- Vote submission errors are logged

## Contributing

1. Follow the existing code structure
2. Use consistent naming conventions
3. Add proper error handling
4. Update documentation for new features
5. Test all functionality before submitting changes
