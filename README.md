# AlumniHub - Alumni Network Management Platform

A comprehensive full-stack web application designed to connect alumni, students, and administrators through an interactive platform for events, job postings, donations, and communications.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Usage](#usage)
- [Contributing](#contributing)

## 🌟 Overview

AlumniHub is a modern alumni engagement platform that facilitates networking between alumni, current students, and institution administrators. It provides a centralized hub for event management, job opportunities, fundraising campaigns, and community communications.

### Key Capabilities

- **User Management**: Multi-role authentication system (Admin, Alumni, Student)
- **Event Management**: Create, manage, and RSVP to alumni events
- **Job Board**: Post and apply for job opportunities
- **Donation System**: Manage fundraising campaigns and track donations
- **Communications**: Internal messaging and announcements
- **Analytics**: Admin dashboard with insights and metrics

## ✨ Features

### For Alumni & Students

- 🔐 Secure authentication with JWT and refresh tokens
- 👤 Customizable user profiles with social links (LinkedIn, GitHub)
- 📅 Event discovery and registration
- 💼 Job posting and application system
- 💰 Donation campaigns participation
- 💬 Personal messaging and communications
- 🔔 Real-time notifications

### For Administrators

- 📊 Comprehensive analytics dashboard
- 👥 User management and verification
- 🎉 Event creation and management
- 💵 Donation campaign oversight
- ✅ Job posting verification and approval
- 📢 Broadcast communications
- 📈 Track engagement metrics

## 🛠 Tech Stack

### Frontend (Alumnihub-Frontend)

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui (Radix UI components)
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Charts**: Recharts
- **Deployment**: Vercel

### Backend (SIH-PROJECT)

- **Runtime**: Node.js with ES Modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt/bcryptjs
- **File Upload**: Multer
- **Cloud Storage**: Cloudinary
- **Email**: Nodemailer
- **OTP Generation**: otp-generator
- **CSV Parsing**: csv-parser
- **CORS**: Enabled for cross-origin requests

## 📁 Project Structure

```
AllyNet Original/
│
├── Alumnihub-Frontend/          # React TypeScript Frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   ├── layout/          # Layout components (header, sidebar)
│   │   │   ├── communication/   # Communication features
│   │   │   └── jobs/            # Job-related components
│   │   ├── pages/               # Route pages
│   │   │   ├── auth/            # Authentication pages
│   │   │   ├── admin/           # Admin-only pages
│   │   │   └── *.tsx            # User pages
│   │   ├── context/             # React Context (Auth)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utility functions
│   │   └── services/            # API services
│   ├── public/                  # Static assets
│   └── package.json
│
└── SIH-PROJECT/                 # Node.js Express Backend
    ├── src/
    │   ├── controllers/         # Request handlers
    │   ├── models/              # Mongoose schemas
    │   ├── routes/              # API routes
    │   ├── middlewares/         # Auth, upload, etc.
    │   ├── services/            # Business logic
    │   ├── utils/               # Helper functions
    │   ├── db/                  # Database connection
    │   ├── app.js               # Express app setup
    │   └── index.js             # Entry point
    ├── public/temp/             # Temporary file uploads
    └── package.json
```

## 🚀 Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or bun package manager
- Cloudinary account (for image uploads)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd "SIH-PROJECT"
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root of `SIH-PROJECT`:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=7d
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```

4. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd "Alumnihub-Frontend"
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Create a `.env` file in the root of `Alumnihub-Frontend`:
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
# or
bun run dev
```

The frontend will run on `http://localhost:5173`

## 🔧 Environment Variables

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/alumnihub` |
| `ACCESS_TOKEN_SECRET` | JWT access token secret | Random string |
| `ACCESS_TOKEN_EXPIRY` | Access token expiration | `1d` |
| `REFRESH_TOKEN_SECRET` | JWT refresh token secret | Random string |
| `REFRESH_TOKEN_EXPIRY` | Refresh token expiration | `7d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Your cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Your API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Your API secret |
| `EMAIL_USER` | Email for OTP service | `email@example.com` |
| `EMAIL_PASS` | Email password/app password | Your password |

### Frontend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Login
```
POST /login
Body: { email, password }
Response: { user, accessToken, refreshToken }
```

#### Forgot Password
```
POST /forgot-password
Body: { email }
Response: { message, OTP sent to email }
```

#### Verify OTP
```
POST /verify-otp
Body: { email, otp }
Response: { message, success }
```

#### Reset Password
```
POST /reset-password
Body: { email, password }
Response: { message, success }
```

### User Endpoints

#### Get All Users
```
GET /users/alluser
Headers: Authorization: Bearer <token>
Response: { users[] }
```

#### Get Current User
```
GET /users/user
Headers: Authorization: Bearer <token>
Response: { user }
```

#### Update User Details
```
PATCH /users/update-user
Headers: Authorization: Bearer <token>
Body: { name, bio, location, etc. }
Response: { user }
```

#### Update Avatar
```
POST /users/update-avatar
Headers: Authorization: Bearer <token>
Body: FormData with avatar file
Response: { user }
```

#### Change Password
```
POST /users/change-password
Headers: Authorization: Bearer <token>
Body: { oldPassword, newPassword }
Response: { message }
```

### Admin Endpoints

#### Get All Admins
```
GET /admin/alladmin
Headers: Authorization: Bearer <admin-token>
Response: { admins[] }
```

#### Get Current Admin
```
GET /admin/admin
Headers: Authorization: Bearer <admin-token>
Response: { admin }
```

#### Bulk Upload Users (CSV)
```
POST /admin/bulk-upload
Headers: Authorization: Bearer <admin-token>
Body: FormData with CSV file
Response: { message, uploadedCount }
```

### Event Endpoints

#### Get All Events
```
GET /events/getEvents
Response: { events[] }
```

#### Create Event (Admin)
```
POST /events/addEvent
Headers: Authorization: Bearer <admin-token>
Body: { title, description, date, time, location }
Response: { event }
```

#### Update Event (Admin)
```
PATCH /events/editEvent/:id
Headers: Authorization: Bearer <admin-token>
Body: { title, description, date, time, location }
Response: { event }
```

#### Delete Event (Admin)
```
DELETE /events/deleteEvent/:_id
Headers: Authorization: Bearer <admin-token>
Response: { message }
```

#### Join Event
```
POST /events/addUserToEvent/:eventID
Headers: Authorization: Bearer <token>
Response: { message }
```

#### Leave Event
```
POST /events/removeUserFromEvent/:eventID
Headers: Authorization: Bearer <token>
Response: { message }
```

### Job Endpoints

#### Get All Jobs
```
GET /jobs/getJobs
Response: { jobs[] }
```

#### Create Job
```
POST /jobs/postJob
Headers: Authorization: Bearer <token>
Body: { title, description, location, jobType, category, experienceRequired, salary }
Response: { job }
```

#### Verify Job (Admin)
```
PATCH /jobs/verifyJob/:id
Headers: Authorization: Bearer <admin-token>
Response: { job }
```

#### Delete Job (Admin)
```
DELETE /jobs/deleteJob/:id
Headers: Authorization: Bearer <admin-token>
Response: { message }
```

### Donation Endpoints

#### Get All Donations
```
GET /donations/getDonations
Response: { donations[] }
```

#### Create Donation Campaign (Admin)
```
POST /donations/addDonation
Headers: Authorization: Bearer <admin-token>
Body: { name, goal }
Response: { donation }
```

#### Contribute to Donation
```
POST /donations/contributeDonation/:donationID
Headers: Authorization: Bearer <token>
Body: { amount }
Response: { donation }
```

## 💻 Usage

### Running the Full Application

1. **Start MongoDB** (if running locally):
```bash
mongod
```

2. **Start Backend**:
```bash
cd SIH-PROJECT
npm start
```

3. **Start Frontend** (in a new terminal):
```bash
cd Alumnihub-Frontend
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Default Roles

- **Student**: Default role for new users
- **Alumni**: Users who have graduated
- **Admin**: Platform administrators with full access

### User Flow

1. **Registration/Login**: Users authenticate via the login page
2. **Profile Setup**: Complete profile with graduation year, company, etc.
3. **Dashboard**: View personalized dashboard with events, jobs, and updates
4. **Events**: Browse and RSVP to upcoming events
5. **Jobs**: Post job opportunities or apply to existing ones
6. **Donations**: Contribute to fundraising campaigns
7. **Messaging**: Communicate with other members

### Admin Flow

1. **Admin Login**: Authenticate with admin credentials
2. **User Management**: View and manage all users
3. **Event Creation**: Create and manage events
4. **Job Verification**: Approve or reject job postings
5. **Analytics**: View platform statistics and engagement metrics
6. **Communications**: Send announcements to all users

## 🔒 Security Features

- JWT-based authentication with access and refresh tokens
- Password hashing using bcrypt (10 rounds)
- HTTP-only cookies for token storage
- CORS configuration for allowed origins
- Input validation with Zod schemas
- Protected routes with middleware authentication
- OTP-based password recovery
- Role-based access control (RBAC)

## 🎨 UI Components

The frontend uses **shadcn/ui** components built on Radix UI primitives:

- Accordion, Alert Dialog, Avatar, Badge
- Button, Calendar, Card, Carousel
- Checkbox, Command, Dialog, Dropdown
- Form, Input, Label, Select
- Table, Tabs, Toast, Tooltip
- And many more...

## 📱 Responsive Design

The application is fully responsive and works across:
- Desktop (1920px+)
- Laptop (1024px - 1920px)
- Tablet (768px - 1024px)
- Mobile (320px - 768px)

## 🚢 Deployment

### Frontend Deployment (Vercel)

The frontend is configured for Vercel deployment with `vercel.json`:

```bash
cd Alumnihub-Frontend
vercel --prod
```

### Backend Deployment (Render/Heroku/Railway)

1. Set environment variables in your hosting platform
2. Deploy the `SIH-PROJECT` directory
3. Ensure MongoDB connection is accessible
4. Update frontend `VITE_API_URL` to production URL

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is part of the Smart India Hackathon (SIH) initiative.

## 👥 Authors

- **Ronit865** - *Initial work* - [Ronit865](https://github.com/Ronit865)

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
- Powered by [Vite](https://vitejs.dev/)
- Generated with [Lovable](https://lovable.dev/)

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Made with ❤️ for connecting alumni communities**
