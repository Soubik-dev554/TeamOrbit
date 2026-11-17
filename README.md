# TeamOrbit

**A Multi-Tenant SaaS Task Management Platform**

TeamOrbit is a full-stack task and project management application built
with the MERN stack. It helps organizations organize teams, manage
projects, assign work, monitor progress, and collaborate through a
centralized workspace.

The platform supports three role-based user types---**Super Admin,
Company Admin, and Employee**---with organization-level data isolation
to keep each company's workspace separate.

## Key Features

### Role-Based Access

-   **Super Admin:** Manage organizations and oversee platform users.
-   **Company Admin:** Manage employees, projects, tasks, and team
    activity within their organization.
-   **Employee:** View assigned tasks, update task status, and
    collaborate on work.

### Organization & Employee Management

-   Multi-tenant organization structure.
-   Organization registration and administration.
-   Invitation-based employee onboarding.
-   Email OTP verification during employee registration.
-   Employee activation and suspension.

### Project & Task Management

-   Create and manage projects.
-   Create, assign, and track tasks.
-   Set task priorities, statuses, and due dates.
-   Filter and search tasks.
-   View project and task progress.

### Collaboration & Visibility

-   Task comments.
-   Notifications for relevant task activity.
-   Activity logs for tracking important actions.
-   Dedicated dashboards for different roles.

### Authentication & Security

-   JWT-based authentication using HTTP-only cookies.
-   Role-based route protection.
-   Password reset functionality.
-   Email verification and invitation flow.
-   Organization-scoped access to company data.

## Technology Stack

  Area             Technologies
  ---------------- ------------------------------------------
  Frontend         React, Vite, Tailwind CSS
  Backend          Node.js, Express.js
  Database         MongoDB, Mongoose
  Authentication   JSON Web Tokens (JWT), HTTP-only cookies
  Email            Brevo API
  HTTP Requests    Axios

## Project Structure

``` text
TeamOrbit/
├── Backend/
│   ├── src/
│   │   ├── bd/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
│   ├── migrate-organization.js
│   ├── package.json
│   └── server.js
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── api.js
│   └── package.json
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Install the following before running the project:

-   Node.js and npm
-   MongoDB database (local MongoDB or MongoDB Atlas)
-   Git

### 1. Clone the repository

``` bash
git clone https://github.com/Soubik-dev554/TeamOrbit.git
cd TeamOrbit
```

### 2. Configure the backend

``` bash
cd Backend
npm install
```

Create a `.env` file inside the `Backend` directory. Add the environment
variables required by your backend configuration. For example:

``` env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_jwt_secret
CLIENT_URL=http://localhost:5173
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_verified_sender_email
```

**Important:** The variable names in this example must match the names
read by your backend code. Never commit your real `.env` file, API keys,
database credentials, or JWT secrets.

Start the backend using the script defined in `Backend/package.json`.
For example:

``` bash
npm run dev
```

If your project uses a different script, use the corresponding command
from `package.json`.

### 3. Configure the frontend

Open a second terminal:

``` bash
cd Frontend
npm install
```

Start the Vite development server:

``` bash
npm run dev
```

Open the local frontend address printed by Vite (commonly
`http://localhost:5173`).

## Environment & Deployment Notes

-   Configure the production frontend URL in the backend environment so
    invitation links point to the deployed application.
-   Configure your production database, JWT secret, and Brevo sender
    credentials securely.
-   Use HTTPS in production.
-   Keep environment files out of version control.
-   Ensure the frontend API base URL points to the deployed backend in
    production.

## Security

TeamOrbit is designed around role-based permissions and
organization-scoped data access. When deploying or extending the
application, verify authorization on the backend for every protected
operation. Never rely only on frontend route protection.

## Future Improvements

Potential areas for future development include expanded analytics,
richer reporting, and additional collaboration tools.

## Author

### Soubik Jana

GitHub: [@Soubik-dev554](https://github.com/Soubik-dev554)