# Voting App Documentation

## 1. Introduction

This document provides a comprehensive overview of the Voting App, a full-stack application designed to facilitate secure and real-time elections. The application provides separate interfaces for students (voters) and administrators, with a focus on security, data integrity, and real-time feedback.

## 2. System Architecture

The application follows a standard client-server architecture:

*   **Server:** A Node.js application built with the Express.js framework. It handles all business logic, data processing, and communication with the database.
*   **Database:** A MongoDB database is used for data persistence. Mongoose is used as the Object Data Modeling (ODM) library to interact with the database.
*   **Client (Browser):** The front-end is rendered using EJS (Embedded JavaScript templates), which allows for dynamic generation of HTML. The user interface is styled with Tailwind CSS. Client-side interactivity is handled with vanilla JavaScript and Socket.IO for real-time communication.

## 3. Data Models

The application uses four main data models, defined in the `/models` directory:

### `Student`

Represents a student who can vote in the election.

| Field | Type | Description |
| :--- | :--- | :--- |
| `studentId` | String | The unique identifier for the student. |
| `password` | String | The student's password. It is hashed using bcrypt before being saved to the database. |
| `role` | String | The role of the user, which can be `student` or `teacher`. Defaults to `student`. |
| `hasVoted` | Boolean | A flag to indicate if the student has already cast their vote. Defaults to `false`. |
| `votedPositions` | Array | An array of objects, where each object records the position and the candidate the student voted for. |

### `Candidate`

Represents a candidate running in the election.

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | String | The name of the candidate. |
| `position` | String | The position the candidate is running for (e.g., "Head Boy", "Head Girl"). |
| `votes` | Number | The total number of votes the candidate has received. Defaults to `0`. |
| `image` | String | The path to the candidate's image. |

### `Election`

Represents the election itself.

| Field | Type | Description |
| :--- | :--- | :--- |
| `status` | String | The current status of the election. Can be `pending`, `running`, or `ended`. Defaults to `pending`. |
| `startTime` | Date | The date and time when the election starts. |
| `endTime` | Date | The date and time when the election ends. |

### `VoteLog`

Records every individual vote cast in the election.

| Field | Type | Description |
| :--- | :--- | :--- |
| `studentId` | ObjectId | A reference to the `Student` who cast the vote. |
| `candidateId` | ObjectId | A reference to the `Candidate` who received the vote. |
| `position` | String | The position for which the vote was cast. |

## 4. Authentication

The application uses JSON Web Tokens (JWT) for authentication.

### Admin Authentication

*   The admin logs in by submitting a secret key.
*   If the secret is correct, the server generates a JWT with a role of `admin` and sends it to the client as a cookie.
*   Subsequent requests to protected admin routes must include this JWT. The `verifyToken` middleware checks for the presence and validity of the token.

### Student Authentication

*   The student logs in with their `studentId` and `password`.
*   If the credentials are correct, the server generates a JWT with a role of `student` and sends it to the client as a cookie.
*   This JWT is then used to authenticate the student for actions like voting.

## 5. API Endpoints

The application exposes several API endpoints, which are defined in the `/routes` directory.

### Admin Routes (`/admin`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/login` | Authenticates the admin. |
| `GET` | `/dashboard` | Renders the admin dashboard. |
| `POST` | `/students/add` | Adds a new student. |
| `POST` | `/students/delete/:id` | Deletes a student. |
| `POST` | `/candidates/add` | Adds a new candidate. |
| `POST` | `/candidates/delete/:id` | Deletes a candidate. |
| `POST` | `/election/start` | Starts the election. |
| `POST` | `/election/end` | Ends the election. |
| `POST` | `/election/reset` | Resets the election. |

### Student Routes (`/`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/login` | Authenticates the student. |
| `GET` | `/vote` | Renders the voting page. |
| `POST` | `/vote` | Submits a student's vote. |
| `GET` | `/slip` | Renders the vote slip page. |

## 6. Real-time Functionality

The application uses Socket.IO to provide real-time updates to the admin dashboard.

*   **`voteUpdate`**: When a vote is cast, the server emits a `voteUpdate` event with the updated vote count for the candidate. The admin dashboard listens for this event and updates the UI in real-time.
*   **`newVoteLog`**: The server also emits a `newVoteLog` event with the details of the new vote. The admin dashboard listens for this event and adds the new log to the vote logs table.

## 7. Environment Variables

The application requires the following environment variables to be set in a `.env` file:

| Variable | Description |
| :--- | :--- |
| `PORT` | The port on which the server will run. Defaults to `5000`. |
| `MONGO_URI` | The connection string for the MongoDB database. |
| `JWT_SECRET` | A secret key used for signing and verifying JSON Web Tokens. |



[Go to Configuration Guide](./config.md)
