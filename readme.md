# Yeshua School — Voting App

An advanced, secure in-house voting system for Yeshua School. This comprehensive application provides separate admin and student interfaces with real-time updates, enhanced accessibility, and sophisticated vote management. Built with Node.js, Express, MongoDB (Mongoose), EJS templates, and Socket.IO.

## ✨ Key Features

- **Secure student authentication** with role-based access control
- **Real-time voting dashboard** with WebSocket updates (Socket.IO)
- **Enhanced admin interface** with collapsible voting activity and user filtering
- **Responsive design** with accessibility improvements
- **Issue reporting system** for students to report problems
- **Dynamic candidate management** with image uploads
- **Election lifecycle control** (start/end/reset)
- **Export functionality** for results and data
- **Comprehensive voting statistics** with live updates

## 🚀 Quick Start

### Requirements
- Node.js (LTS recommended)
- MongoDB (local or hosted)

### Installation
```bash
# Install dependencies
npm install

# Or if using Bun
bun install
```

### Environment Setup
Create a `.env` file in the project root:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/voting-app
JWT_SECRET=your-super-secret-jwt-key-here
SCHOOL_NAME=Yeshua High School
SCHOOL_LOGO=/images/logo.png
```

### Run the Application
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Open [http://localhost:5000](http://localhost:5000) (or your configured port).

## 📁 Project Structure

```
├── server.js                 # Main application entry point
├── config/                   # Database and configuration files
├── middleware/              # Authentication and other middleware
├── models/                  # Mongoose data models
├── routes/                  # API route definitions
├── views/                   # EJS templates
├── public/                  # Static assets (CSS, JS, images)
│   ├── css/                 # Stylesheets
│   ├── js/                  # Client-side JavaScript
│   └── images/              # Image assets
└── node_modules/            # Dependencies
```

## 🛠️ Core Functionality

### Admin Panel (`/admin`)
- **Dashboard** - Real-time voting activity with collapsible user views
- **Voter Management** - Add, remove, suspend students and reset passwords
- **Candidate Management** - Add/remove candidates with image uploads  
- **Election Control** - Start, end, and reset elections
- **Results Preview** - View/export election results as PDF
- **Issue Tracking** - Monitor and resolve reported issues

### Student Interface (`/`)
- **Login** - Secure authentication with student ID and password
- **Voting Interface** - Clean, accessible voting form with review process
- **Vote Confirmation** - Receipt showing selected candidates
- **Issue Reporting** - Submit problems to admin team

### API Overview

#### Admin Routes
```
GET     /admin/dashboard          # Admin dashboard with real-time voting
GET     /admin/voters             # Voter and issue management
POST    /admin/students/add       # Add new student
POST    /admin/students/delete/:id # Remove student
POST    /admin/candidates/add     # Add candidate (with image upload)
POST    /admin/candidates/delete/:id # Remove candidate
POST    /admin/election/start     # Start election
POST    /admin/election/end       # End election  
POST    /admin/election/reset     # Reset election data
GET     /admin/export-data        # Export election data as JSON
GET     /admin/export-pdf         # Export results as PDF
GET     /admin/view-pdf           # Preview results
POST    /admin/student/:id/suspend # Suspend student
POST    /admin/student/:id/enable  # Enable student
POST    /admin/issues/:id/status   # Update issue status
```

#### Student Routes
```
GET     /login                    # Login page
POST    /login                    # Authenticate student
GET     /vote                     # Voting interface
POST    /vote                     # Submit vote
GET     /slip                     # Vote confirmation slip
POST    /submit-issue             # Report an issue
POST    /logout                   # Logout from session
```

## 🎨 Enhanced Features

### Real-time Dashboard
- **Live vote updates** with Socket.IO integration
- **Collapsible voting activity** - Group votes by student with expandable sections
- **User filtering** - Filter voting activity by specific students
- **Detailed vote tracking** - Shows all positions voted by each student

### Accessibility Improvements
- **Keyboard navigation** - Full keyboard support for all interactive elements
- **ARIA labels** - Proper accessibility attributes for screen readers
- **Focus management** - Clear focus indicators and logical tab order
- **Responsive design** - Works on all device sizes

### Admin Enhancements
- **Quick actions dropdown** - Streamlined admin operations
- **Enhanced user management** - Better student suspension/activation workflow
- **Improved voting activity** - Better organized and filterable vote logs
- **Real-time candidate updates** - Live vote count updates

## 🔐 Security Features

- **Password hashing** with bcrypt
- **JWT authentication** with session management
- **Rate limiting** on sensitive endpoints
- **Input validation** and sanitization
- **File upload validation** for candidate images
- **Content Security Policy** to prevent XSS attacks
- **Secure cookies** with HTTP-only flags

## 🔧 Troubleshooting

### Common Issues
- **MongoDB connection errors**: Verify MongoDB is running and URI is correct
- **Authentication failures**: Ensure `JWT_SECRET` is set and consistent
- **File upload issues**: Check `public/candidatesUpload/` directory permissions
- **WebSocket connection problems**: Verify network configuration

### Performance Tips
- **Database indexing**: Ensure proper indexes on frequently queried fields
- **Memory management**: Monitor app memory usage with large datasets
- **Caching**: Consider implementing caching for repetitive queries

## 👥 Maintainers & Support

This repository is maintained for Yeshua School. For support inquiries:

- **Maintainer**: Dev-Dami (repo owner)
- **School**: Yeshua School
- **Contact**: [School IT Department]

## 📈 Development Notes

### Technologies Used
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: EJS templates, Tailwind CSS, JavaScript
- **Real-time**: Socket.IO
- **Security**: Helmet.js, bcrypt, JWT
- **File Upload**: Multer

### Customization
This application can be easily adapted for other educational institutions by:
- Updating school branding in `.env` file
- Modifying available positions in admin panel
- Adjusting styling in CSS files
- Customizing the issue reporting workflow

---

*Built with ❤️ for Yeshua School community*