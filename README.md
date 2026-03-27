# Futsal Management System - Production-Ready Foundation

A secure, well-architected Node.js/Express authentication system with modern development practices. Perfect foundation for building a comprehensive futsal court management and booking platform.

## ✨ Key Features

- **Secure Authentication**: JWT-based sessions with HTTP-only cookies
- **Modular Architecture**: Clean code organization with middleware, routes, and utilities
- **Input Validation**: Joi-based validation with detailed error messages
- **Security Hardening**: Helmet.js, CORS, rate limiting, origin checks
- **Logging**: Winston-based structured logging for production debugging
- **Code Quality**: ESLint and Prettier configuration for consistent code
- **Testing**: Unit tests for validators with Node.js built-in test runner
- **CI/CD Ready**: GitHub Actions workflow for automated testing
- **SQLite Database**: Automatic schema creation with bcrypt password hashing
- **Environment Management**: Secure .env configuration with production validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Server will start on `http://localhost:3000`

### Access the App

- **Login Page**: http://localhost:3000/login.html
- **Signup Page**: http://localhost:3000/signup.html
- **Dashboard**: http://localhost:3000/dashboard (requires authentication)

## 📋 Environment Configuration

### Development (Local)

No setup required - development defaults are used.

### Production

Create a `.env` file with:

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=replace_with_a_long_random_secret_at_least_32_chars
ALLOWED_ORIGIN=https://your-domain.com
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict
```

**⚠️ Important**: Generate a strong JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 📁 Project Structure

```
.
├── src/
│   ├── middleware/          # Express middleware
│   │   ├── authentication.js # Auth and CORS
│   │   ├── errorHandler.js   # Error handling
│   │   ├── rateLimiter.js    # Rate limiting
│   │   └── validation.js     # Joi validation middleware
│   ├── routes/
│   │   └── auth.js          # Authentication endpoints
│   └── utils/
│       ├── config.js        # Configuration management
│       ├── logger.js        # Winston logger
│       └── validators.js    # Joi schemas
├── tests/
│   └── validators.test.js   # Unit tests
├── public/
│   ├── login.html           # Login UI
│   ├── signup.html          # Signup UI
│   └── js/                  # Frontend JavaScript
├── views/
│   └── dashboard.html       # Protected dashboard
├── server.js                # Main application entry
├── db.js                    # SQLite setup
└── package.json
```

## 🔐 API Endpoints

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | No | Create new account |
| POST | `/api/auth/login` | No | Authenticate user |
| GET | `/api/auth/me` | **Yes** | Get current user |
| POST | `/api/auth/logout` | No | Clear auth cookie |

### Health Check

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | API status |

### Request Examples

**Signup**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

**Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

**Get Current User**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Cookie: auth=<token>"
```

## 📝 Database

SQLite database is automatically created at `data/auth.db` with:

- **users** table
  - `id` (INTEGER PRIMARY KEY)
  - `email` (TEXT UNIQUE)
  - `password_hash` (TEXT)
  - `created_at` (TEXT)

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Validator Tests
Includes comprehensive tests for email validation, password strength, and edge cases.

## 🔍 Code Quality

### Lint Code
```bash
npm run lint
```

### Fix Linting Issues
```bash
npm run lint:fix
```

### Format Code
```bash
npx prettier --write "**/*.js"
```

## 🔒 Security Features

- ✅ HTTP-only cookies (prevents XSS token theft)
- ✅ Rate limiting on auth endpoints
- ✅ CORS origin validation
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Security headers via Helmet.js
- ✅ Content Security Policy
- ✅ X-Frame-Options: DENY
- ✅ Input validation with Joi
- ✅ Environment variable validation

## 📊 Logging

### Development
Console logging with color-coded levels (debug, info, warn, error).

### Production
- Console output for real-time monitoring
- File logging to `logs/` directory
- Separate error and combined logs with rotation

## 🔄 CI/CD Pipeline

Automated testing on every push to `main` and `develop`:
- Runs on Node.js 18 and 20
- Linting checks
- Unit tests
- Security audit (moderate level)

View workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

## 📦 Dependencies

### Production
- `express` - Web framework
- `helmet` - Security headers
- `jsonwebtoken` - JWT handling
- `bcryptjs` - Password hashing
- `joi` - Input validation
- `sqlite3` - Database
- `winston` - Logging
- `cookie-parser` - Cookie handling
- `cors` - CORS support

### Development
- `eslint` - Code linting
- `prettier` - Code formatting

## 🚀 Deployment

### Heroku
```bash
heroku create your-futsal-app
git push heroku main
```

### Docker (Optional)

Create `Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Railway/Render
1. Connect GitHub repository
2. Set environment variables
3. Deploy

## 🎯 Next Steps

This foundation includes:
- ✅ User authentication & session management
- ✅ Secure API structure
- ✅ Code organization best practices
- ✅ Logging and error handling
- ✅ Input validation
- ✅ CI/CD pipeline

Ready to add:
- [ ] Court management (CRUD operations)
- [ ] Booking system
- [ ] Schedule management
- [ ] Admin dashboard
- [ ] Payment integration
- [ ] Email notifications
- [ ] API documentation (Swagger)
- [ ] Advanced analytics

## 📄 License

ISC

## 🤝 Contributing

1. Follow the existing code style (ESLint + Prettier)
2. Run tests before pushing: `npm test`
3. Add tests for new features
4. Update documentation

## 📞 Support

For issues or questions, create a GitHub issue.

---

**Built with security, scalability, and developer experience in mind.** ⚡

