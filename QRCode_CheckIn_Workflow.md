# QR Code Check-in Workflow Documentation

## Overview
The QR Code Check-in feature provides a secure and fast way for facility staff to validate customer bookings when they arrive at the futsal center. Instead of asking for names or booking IDs, customers simply present a QR code from their "My Bookings" page or confirmation email.

---

## 1. Database Architecture
To make the check-in process secure and prevent users from guessing booking IDs to generate fake QR codes, two new columns were added to the `bookings` table in the SQLite database:
- **`validation_token`**: A unique UUID (Universally Unique Identifier) string generated at the time of booking. This acts as a secret key for each booking.
- **`arrival_status`**: A text field that defaults to `pending` and updates to `arrived` when the QR code is successfully scanned by an admin.

## 2. Token Generation (Checkout)
When a customer completes a booking (`POST /api/bookings/checkout`), the backend automatically generates a secure `validation_token` using the `uuid` package. This token is saved alongside the booking details in the database.

## 3. Delivering the QR Code to the Customer
The system ensures the customer has easy access to their QR code through two channels:

### A. Customer Dashboard (Frontend)
On the **My Bookings** page (`bookings.html`), the system loads the `qrcode` library via CDN. After fetching the user's bookings, the frontend JavaScript (`script.js`) checks if a booking is confirmed and has a validation token. If so, it dynamically draws a QR code onto an HTML `<canvas>` element. The QR code encodes a full URL pointing to the admin validation portal: 
`https://[your-domain]/admin.html?validate=[validation_token]`

### B. Confirmation Email (Backend)
When the booking confirmation email is sent (`src/utils/mailer.js`), the backend uses the `qrcode` Node.js package to generate the QR code as a Base64 data URI. This image is then embedded securely as a CID (Content-ID) inline attachment in the email HTML. This allows the customer to view the QR code directly in their email client without needing to log in to the website.

## 4. Admin Scanning & Validation Process
When the customer arrives at the futsal center, the staff member uses any smartphone camera (or a tablet scanner) to scan the QR code.

1. **Scanning**: The camera decodes the URL and prompts the staff member to open the link (`/admin.html?validate=[validation_token]`).
2. **Authentication**: If the staff member is not logged in as an Admin, the system redirects them to the login page first.
3. **Data Retrieval**: Once authenticated, the Admin Portal's JavaScript (`admin-portal.js`) detects the `?validate=` query parameter and sends a request to `GET /api/admin/validate/:token`.
4. **Validation View**: The portal hides the normal dashboard and displays a special Validation View. It shows the customer's name, court number, time, payment status, and current arrival status.
5. **Confirm Arrival**: If the arrival status is `pending`, a large "Confirm Arrival" button is displayed. Clicking this button sends a request to `POST /api/admin/validate/:token/confirm`, updating the database and marking the customer as `arrived`.

---

## Security Benefits
- **Anti-tampering**: Because the QR code uses a complex UUID rather than a sequential ID (like `1` or `25`), malicious users cannot generate fake QR codes for other people's courts.
- **Protected Endpoints**: The validation endpoints are strictly protected by `requireAuth` and `requireAdmin` middleware. If a customer tries to scan their own QR code, they will be denied access to the admin portal.
