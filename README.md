# Futsal Management System - Complete Platform

A comprehensive, secure, and production-ready Node.js/Express application for managing futsal court bookings. It features a complete user authentication system, court booking engine, simulated payment gateway, automated email notifications, and a full-featured administrative dashboard.

## ✨ Key Features

- **Secure Authentication**: JWT-based sessions with HTTP-only cookies, password hashing (bcrypt), and role-based access control (Admin vs. Customer).
- **Court Booking Engine**: Real-time availability checking, booking management, and tiered pricing for different courts.
- **Payment & Refund Simulation**: Card payment validation and processing simulation, along with automated refund calculations based on cancellation timing.
- **Admin Dashboard**: Comprehensive overview of revenue, active/cancelled bookings, court utilization metrics, and user management (role assignments, analytics).
- **Automated Email Notifications**: Integration with Google SMTP (via Nodemailer) for sending automatic booking confirmation emails.
- **Robust Security**: Helmet.js for security headers, CORS origin checks, rate limiting, and Joi-based input validation.
- **Code Quality & CI/CD**: Pre-configured ESLint, Prettier, Node.js built-in test runner, and a GitHub Actions workflow.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn

### Installation

```bash
git clone <repository-url>
cd futsalsystem
npm install
```

### Environment Setup

Create a `.env` file based on the provided `.env.example`:

```bash
cp .env.example .env
```
*(See the Environment Configuration section below for details).*

### Development

```bash
npm run dev
```

The server will start on `http://localhost:3010` (or your configured `PORT`).

### Access the App
- **Home/Login Page**: `http://localhost:3010/login.html`
- **Dashboard (Customer)**: `http://localhost:3010/home` (Requires authentication)
- **Admin Portal**: `http://localhost:3010/admin` (Requires authentication & Admin role)

## 📋 Environment Configuration

Create a `.env` file with the following variables:

```env
# Application Core
NODE_ENV=development # Set to 'production' in production environment
PORT=3010
JWT_SECRET=your_super_secret_jwt_key_here

# Security
ALLOWED_ORIGIN=http://localhost:3010
COOKIE_SECURE=false # Set to true in production if using HTTPS
COOKIE_SAME_SITE=strict

# Admin Setup (Automatically created on initial boot)
ADMIN_EMAILS=admin@localhost
ADMIN_PASSWORD=your_secure_admin_password
ADMIN_NAME=Admin User

# Email Notifications (Google SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
MAIL_FROM="FutsalHub <your-email@gmail.com>"
BOOKING_NOTIFICATION_EMAIL=your-email@gmail.com
```

**⚠️ Important**: 
1. Use an [App Password](https://support.google.com/accounts/answer/185833?hl=en) for `SMTP_PASS` if using Gmail.
2. In production, ensure `JWT_SECRET` is strong and random.
3. `COOKIE_SECURE` should be `true` in production to enforce HTTPS-only cookies.

## 📁 Project Structure

```text
.
├── src/
│   ├── middleware/          # Express middlewares (Auth, Validation, Error Handling)
│   ├── routes/              # API Route definitions
│   │   ├── admin.js         # Admin endpoints (users, overview analytics)
│   │   ├── auth.js          # Authentication (login, signup, me)
│   │   └── bookings.js      # Booking engine, checkout, cancellations
│   └── utils/
│       ├── config.js        # Environment config loader & validator
│       ├── logger.js        # Winston structured logging
│       ├── mailer.js        # Nodemailer email configurations
│       ├── paymentGateway.js# Payment & refund simulator
│       └── validators.js    # Joi validation schemas
├── public/                  # Static frontend assets (HTML, CSS, JS)
│   ├── admin.html           # Admin Dashboard UI
│   ├── index.html           # Customer Dashboard UI
│   ├── login.html           # Login UI
│   ├── signup.html          # Signup UI
│   ├── admin.js             # Admin Dashboard logic
│   └── script.js            # Main application logic
├── tests/                   # Unit tests
├── db.js                    # SQLite database initialization
├── server.js                # Express application entry point
└── package.json             # Dependencies and scripts
```

## 🔐 API Endpoints

### Authentication (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/signup` | No | Create a new user account |
| POST | `/login` | No | Authenticate user & set JWT cookie |
| GET | `/me` | **Yes** | Retrieve current user profile |
| POST | `/logout` | No | Clear the authentication cookie |

### Bookings (`/api/bookings`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | **Yes** | Get all bookings for a specific date (Query: `?date=YYYY-MM-DD`) |
| GET | `/mine` | **Yes** | Get all bookings for the authenticated user |
| POST | `/checkout` | **Yes** | Create a new booking and process payment |
| POST | `/:id/cancel`| **Yes** | Cancel a booking and process potential refunds |

### Admin (`/api/admin`)
| Method | Path | Admin | Description |
|--------|------|-------|-------------|
| GET | `/users` | **Yes** | List all users and their booking statistics |
| PATCH | `/users/:id/role`| **Yes** | Change a user's role (`admin` or `customer`) |
| GET | `/overview` | **Yes** | Get analytics (revenue, utilization) between `startDate` & `endDate` |

## 📝 Database Schema

The system uses SQLite (stored locally at `data/auth.db`) with automatic schema setup.

- **users**: Stores user credentials, roles (`admin` or `customer`), and profile data.
- **bookings**: Stores court bookings, time slots, pricing, cancellation reasons, and status (`confirmed`, `cancelled`).
- **payments**: Tracks payment transactions, methods (`card`, `cash`), partial/full refunds, and timestamps.

## 🧪 Testing & Code Quality

### Run Tests
```bash
npm test
```

### Code Formatting & Linting
```bash
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix lint issues
npx prettier --write "**/*.js" # Format code
```

## 🔒 Security Features

- ✅ **HTTP-Only Cookies**: Prevents client-side script access to JWTs (XSS protection).
- ✅ **Helmet.js & CSP**: Enforces secure HTTP headers and Content Security Policies.
- ✅ **CORS & Origin Checks**: Strictly allows requests only from configured origins.
- ✅ **Bcrypt Hashing**: Passwords hashed with 12 rounds of salt.
- ✅ **Input Validation**: Joi middleware prevents injection and invalid payload attacks.
- ✅ **Role-Based Access Control**: Middleware rigorously checks for admin privileges on sensitive routes.

## 🔄 CI/CD Pipeline

A GitHub Actions workflow is included (`.github/workflows/ci.yml`) that automatically runs on pushes to `main` and `develop`:
- Runs tests across multiple Node.js versions (18, 20).
- Performs ESLint checks.
- Runs `npm audit` for security vulnerability scanning.

## 🚀 Deployment

The project is stateless regarding sessions (uses JWT) but stateful regarding the database (SQLite). For true scalability, consider swapping SQLite with PostgreSQL.

### systemd Service

To run the app in the background with `systemctl`, copy the service file into `/etc/systemd/system/` and enable it:

```bash
sudo cp systemd/futsal-management-system.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now futsal-management-system
sudo systemctl status futsal-management-system
```

If your Linux user is not `isaac`, update the `User=` and `Group=` lines in the service file before enabling it.

For day-to-day management, use the helper script:

```bash
chmod +x scripts/systemd.sh
scripts/systemd.sh restart
scripts/systemd.sh status
scripts/systemd.sh logs -f
```

### Render / Railway Setup:
1. Connect your GitHub repository.
2. Ensure you have persistent storage (a volume) mapped to the `data/` directory so your SQLite database isn't lost on restarts.
3. Configure Environment Variables matching the `.env` requirements.
4. Set the Start Command to `npm start`.

### Docker (Optional):
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
# Ensure the data directory exists for SQLite
RUN mkdir -p data
EXPOSE 3010
CMD ["npm", "start"]
```

## 🎯 Current Status & Roadmap

- [x] User authentication & session management
- [x] Secure API structure & Validation
- [x] Court Booking system & constraints
- [x] Payment simulation & dynamic refund logic
- [x] Admin dashboard & analytics overview
- [x] Automated Email notifications via SMTP
- [ ] Implement robust API documentation (e.g., Swagger/OpenAPI)
- [ ] Court management (CRUD operations for courts & dynamic pricing)
- [ ] External payment provider integration (Stripe / PayPal)

## 🤝 Contributing

1. Clone the repository and install dependencies.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Adhere to the existing code style (Prettier & ESLint).
4. Run `npm test` to ensure tests pass.
5. Commit your changes and open a Pull Request.

## 📄 License

ISC

---

**Built with security, scalability, and an excellent developer experience in mind.** ⚡
