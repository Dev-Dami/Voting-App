# Voting App Configuration Guide

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000                    # Server port
MONGODB_URI=mongodb://localhost:27017/voting-app  # Database connection
JWT_SECRET=your-super-secret-jwt-key-here        # JWT encryption key
SCHOOL_NAME=Yeshua High School                   # School display name
SCHOOL_LOGO=/images/logo.png                     # School logo path
NODE_ENV=development            # Environment (development/production)
```

## Database Models

### Student
```javascript
{
  studentId: String,     // Unique student identifier
  password: String,      // Bcrypt-hashed password
  role: String,          // "student" (default), "admin"
  hasVoted: Boolean,     // Whether student has voted
  isSuspended: Boolean,  // Account suspension status
  votedPositions: [{    // Array of positions voted for
    position: String,
    candidateId: ObjectId
  }],
  createdAt: Date,      // Account creation timestamp
  updatedAt: Date       // Last update timestamp
}
```

### Candidate
```javascript
{
  name: String,          // Candidate full name
  position: String,      // Election position (e.g., "Head Boy")
  customPosition: String, // Custom position name (if applicable)
  votes: Number,         // Total vote count (incremented on vote)
  image: String,         // Path to candidate image
  createdAt: Date,       // Candidate creation timestamp
  updatedAt: Date        // Last update timestamp
}
```

### Election
```javascript
{
  status: String,        // "pending", "running", "ended"
  startTime: Date,       // Election start time (set when started)
  endTime: Date,         // Election end time (set when started)
  createdAt: Date,       // Creation timestamp
  updatedAt: Date        // Last update timestamp
}
```

### VoteLog
```javascript
{
  studentId: ObjectId,   // Reference to voting student
  candidateId: ObjectId, // Reference to voted candidate
  position: String,      // Position being voted for
  createdAt: Date,       // Vote timestamp
  updatedAt: Date        // Last update timestamp
}
```

### Issue
```javascript
{
  name: String,          // Reporter's name
  className: String,     // Reporter's class/grade
  problem: String,       // Issue description
  status: String,        // "pending", "in-progress", "resolved"
  createdAt: Date,       // Submission timestamp
  updatedAt: Date        // Last status update timestamp
}
```

## Application Scripts

```bash
# Install dependencies
npm install
# or
bun install

# Development mode (with auto-restart)
npm run dev

# Production mode
npm start

# Alternative production command
node server.js
```

## Security Configuration

### Authentication
- **Passwords**: Hashed with bcrypt (12 rounds)
- **Tokens**: JWT with configurable expiration (1-2 hours)
- **Sessions**: Secure HTTP-only cookies
- **Access Control**: Role-based (admin/student)

### Rate Limiting
- **Login attempts**: Limited to prevent brute force
- **Voting**: Protected against multiple submissions
- **Issue reporting**: Prevents spam submissions

### File Upload Protection
- **Image validation**: Checks file type and dimensions
- **Size limits**: Maximum 5MB per image
- **Storage location**: `public/candidatesUpload/` directory
- **Security**: No executable files allowed

### Content Security Policy
- **Script sources**: Self, unsafe-inline, cdnjs.cloudflare.com, cdn.jsdelivr.net
- **Style sources**: Self, unsafe-inline, fonts.googleapis.com
- **Image sources**: Self, data:, blob:
- **Connect sources**: Self, cdn.jsdelivr.net, wss:, ws:

## Real-time Features

### Socket.IO Integration
- **Live voting updates**: Real-time vote count updates
- **Dashboard notifications**: Instant activity alerts
- **Connection management**: Automatic reconnection handling
- **Performance**: Optimized for multiple concurrent connections

## Deployment Configuration

### Production Requirements
- **Node.js**: v16+ recommended
- **MongoDB**: v4.4+ recommended
- **Memory**: Minimum 512MB RAM
- **Storage**: Sufficient space for candidate images
- **Network**: WebSocket support required

### Environment Variables for Production
```env
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb+srv://...
JWT_SECRET=production-secret-key
SCHOOL_NAME="Production School Name"
SCHOOL_LOGO=/images/production-logo.png
```

## Admin Panel Features

### Dashboard Elements
- **Statistics Cards**: Real-time voting metrics
- **Quick Actions**: Dropdown menu for common operations
- **Voting Activity**: Collapsible user-based vote logs with filtering
- **Candidate Management**: Position-based grouping with voting stats
- **Student Management**: Bulk operations and status controls

### Election Management
- **Lifecycle Control**: Start/End/Reset functionality
- **Time Management**: Set start/end times for running election
- **Voter Registration**: Add/remove students from voting pool
- **Result Export**: JSON and PDF export capabilities

## Frontend Configuration

### Client-Side Libraries
- **Chart.js**: v3.9.1 (CDN: cdn.jsdelivr.net/npm/chart.js)
- **Socket.IO Client**: v4.7.2 (CDN: cdn.socket.io/4.7.2/socket.io.min.js)
- **Tailwind CSS**: Compiled version included
- **Custom JavaScript**: Vote management and dashboard interactivity

### Accessibility Features
- **ARIA Labels**: Proper semantic markup
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Clear focus indicators
- **Screen Reader Support**: Proper heading structure

This configuration ensures a secure, scalable, and user-friendly voting system for educational institutions.