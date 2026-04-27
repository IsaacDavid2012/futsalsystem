### Chapter 4 : System Implementation and Testing

**4.0 Overview**
This chapter shows the implementation and functionality of the Futsal Booking System. It shows how the system was developed and also explains the technologies used. System interfaces and outputs will be demonstrated.

**4.1 System Implementation**

**4.1.1 System Architecture**
The system uses a client-server architecture:
● Frontend is HTML, CSS, and Vanilla JavaScript
● Backend is Node.js with Express framework
● Database (SQLite)

The system functions as the user interacts with the web interface. Which then sends requests to the server through secure RESTful API endpoints. The server will request, validate, process, and retrieve or update the data from the database.

**4.1.2 Database Design**
The database of the system uses SQLite. These are the main tables:

1. **Users Table**
● ID (PRIMARY)
● Email (UNIQUE)
● Password_hash (HASHED)
● Role (To differentiate 'customer' and 'admin')
● Full_name
● Phone
● Created_at

2. **Bookings Table**
● ID (PRIMARY)
● User_id (FOREIGN KEY from users.id)
● Court_number
● Booking_date
● Time_slot
● Customer_name
● Customer_phone
● Customer_email
● Price_cents
● Status (default = 'confirmed')
● Payment_status
● Refund_cents
● UNIQUE Constraint (court_number, booking_date, time_slot) to prevent double-booking

3. **Payments Table**
● ID (PRIMARY)
● Booking_id (FOREIGN KEY from bookings.id)
● User_id (FOREIGN KEY from users.id)
● Amount_cents
● Payment_method
● Card_last4
● Status
● Refund_status (default = 'none')

Court pricing, refund eligibility, and time-slot availability are not hardcoded strictly into the database but are dynamically calculated in the backend based on the current time and selected court logic.

**4.1.3 Core System Features**

**User Authentication**
● Users register with their email credentials which are strictly unique
● Passwords are encrypted and hashed using bcrypt
● Login verifies credentials securely and issues HTTP-only JWT cookies for session persistence

**Court Booking Management**
● Users can browse real-time availability across 5 differently priced futsal courts
● Automatic form auto-filling implemented using the user's stored account details
● Users can securely cancel their bookings, triggering time-based dynamic refund calculations (e.g., 24-hour notice rules)

**Admin Dashboard & Management**
● Admins have a dedicated portal to view court utilization and revenue metrics dynamically over date ranges
● Admins can manage users (promote to admin or demote to customer)
● Admins can override and manually cancel/refund any player's booking
● Data export functionalities to generate CSV reports

**Automated Email Notifications**
● System integrates with Google SMTP to automatically dispatch well-formatted HTML email confirmations to customers instantly upon a successful booking

**4.2 Problems encountered and solutions**

| Problem | Solution |
| :--- | :--- |
| Duplicate court bookings for the same time | Added a strict `UNIQUE` constraint in the database for `(court_number, booking_date, time_slot)` and utilized SQL transactions. |
| Tedious repetitive data entry on checkout | Connected the frontend state to the authentication API to automatically pre-fill customer name and phone details. |
| Insecure passing of card details | Designed a mock payment gateway that processes and immediately strips sensitive data, only saving the `card_last4` digits. |
| Accidental overlapping styles across pages | Refactored the global `styles.css` utilizing custom CSS properties (variables) to maintain a cohesive UI theme across customer and admin portals. |
| Handling environment secrets (Passwords/SMTP) | Utilized `dotenv` to abstract all sensitive variables into an `.env` file instead of hardcoding them into the server. |

**4.3 Testing Strategy**
Functional testing was implemented to ensure all features work correctly. The test types were:
● Unit testing
● Integration Testing
● User Interface Testing

**4.4 Test Plan and Results**

| Test Case | Expected Results | Actual Results | Status |
| :--- | :--- | :--- | :--- |
| Register user | User Creation | Success | Pass |
| Duplicate Email Signup | Error Message | Blocked | Pass |
| Login | Access Granted | Success | Pass |
| View Court Availability | Real-time slots loaded | Success | Pass |
| Book Court Slot | Booking Recorded & Paid | Success | Pass |
| Double Book Same Slot | Blocked by system | Success | Pass |
| Cancel Booking | Refund calculated & status updated | Accurate | Pass |
| Admin View Metrics | Correct Calculation of Revenue | Accurate | Pass |
| Auto Confirmation Email | Email Delivered via SMTP | Success | Pass |

The system has successfully:
● Ensured secure login using password hashing and JWT cookies
● Prevented double-booking of futsal courts using atomic transactions
● Calculated dynamic time-based refund policies automatically
● Delivered real-time administrative metrics and email notifications seamlessly
