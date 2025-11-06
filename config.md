# Voting App Configuration

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/voting-app
JWT_SECRET=your-super-secret-jwt-key-here
SCHOOL_NAME=Your School Name
SCHOOL_LOGO=/images/logo.png
```

## Database Models

### Student
```javascript
{
  studentId: String,     // Unique identifier
  password: String,      // Hashed password
  role: String,          // "student" or "teacher"
  hasVoted: Boolean,     // Voting status
  votedPositions: Array  // Positions voted for
}
```

### Candidate
```javascript
{
  name: String,          // Candidate name
  position: String,      // Election position
  votes: Number,         // Vote count
  image: String          // Image path
}
```

### Election
```javascript
{
  status: String,        // "pending", "running", "ended"
  startTime: Date,       // Election start time
  endTime: Date          // Election end time
}
```

### VoteLog
```javascript
{
  studentId: ObjectId,   // Reference to student
  candidateId: ObjectId, // Reference to candidate
  position: String       // Position voted for
}
```

### Issue
```javascript
{
  name: String,          // Reporter's name
  className: String,     // Reporter's class
  problem: String,       // Problem description
  status: String,        // "pending", "in-progress", "resolved"
  createdAt: Date        // Submission timestamp
}
```

## Scripts

- `npm start` - Production server
- `npm run dev` - Development server with auto-restart

## Security

- Passwords are hashed with bcrypt
- JWT tokens for authentication
- Rate limiting on sensitive endpoints
- File upload validation for images