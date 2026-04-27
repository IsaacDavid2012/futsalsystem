# Futsal Management System - Weekly Logbook

## Week 1
**Weekly Objectives**
Figure out what the Futsal Management System needs to do and set up the main folders.

**Tasks Assigned for the Week**
- List down what the website should be able to do.
- Choose what programming languages to use.
- Create a GitHub repository to save the code.

**Detailed Work Description**
This week, I spent time thinking about how the system should work. I decided the website needs two main users: normal customers and an admin. Customers need to book courts, and the admin needs to see all bookings. I drew a simple diagram on paper to see how the database should look, and I created an empty folder on GitHub to start the project.

**Tools, Technologies & Resources Used**
- Node.js
- GitHub
- Draw.io (for drawing diagram)

**Problems Encountered**
I wasn't sure if I should use React or just normal HTML/CSS and JavaScript. 

**Solutions / Actions Taken**
I decided to stick with normal HTML, CSS, and JavaScript because it's simpler for me to understand and finish on time.

**Contribution Evidence [IMPORTANT]**
- Screenshots of the GitHub empty folder.
- Picture of the database diagram draft.

**Collaboration & Communication**
| Date | Start Time | End time | Mode (Online/Face-to-face/whatsapp’s text) | Presence/absent | Item discussed |
|---|---|---|---|---|---|
| Mon | 10:00 AM | 11:00 AM | Face-to-face | Present | Discussed the main idea of the project |

**Plan for Next Week**
Set up the database online and connect it to the code.

---

## Week 2
**Weekly Objectives**
Create the database so we can save user and booking information.

**Tasks Assigned for the Week**
- Make an account on MongoDB Atlas.
- Write code to connect Node.js to the database.
- Create the structure to save Users and Bookings data.

**Detailed Work Description**
I set up a free database on MongoDB Atlas online. Then, I wrote the connection code in Node.js so my website can talk to the database. I also created the "Schemas" which are like tables to tell the database what information to save (like username, password, date of booking). 

**Tools, Technologies & Resources Used**
- MongoDB Atlas (Database)
- Mongoose (Code to connect DB)

**Problems Encountered**
My code kept failing to connect to MongoDB, and I kept getting a "timeout" error.

**Solutions / Actions Taken**
I found out I needed to allow my IP address in the MongoDB website settings. Once I added my IP, the connection worked.

**Contribution Evidence [IMPORTANT]**
- Screenshot of the connected database on terminal.
- Code snippet of the User Schema.

**Collaboration & Communication**
| Date | Start Time | End time | Mode (Online/Face-to-face/whatsapp’s text) | Presence/absent | Item discussed |
|---|---|---|---|---|---|
| Tue | 2:00 PM | 3:00 PM | WhatsApp | Present | Asked for help with MongoDB error |

**Plan for Next Week**
Work on the login and register pages.

---

## Week 3
**Weekly Objectives**
Make sure users can create an account and log in.

**Tasks Assigned for the Week**
- Write code for Register (Sign up).
- Write code for Login.
- Keep the user logged in using tokens.

**Detailed Work Description**
I worked on the code that takes the user's email and password and saves it to the database. I made sure to hide the passwords so they aren't saved as plain text. For the login, I used something called JWT (JSON Web Tokens) to remember that the user has logged in, so they don't have to type their password on every page.

**Tools, Technologies & Resources Used**
- Node.js (Express)
- Postman (To test if the code works)

**Problems Encountered**
I had trouble figuring out how to save the token so the website remembers the user.

**Solutions / Actions Taken**
I learned how to save the token inside a browser "cookie" which makes it easier to check if the user is allowed to view certain pages.

**Contribution Evidence [IMPORTANT]**
- Postman screenshot showing a successful login message.
- Code snippet of the login function.

**Collaboration & Communication**
| Date | Start Time | End time | Mode (Online/Face-to-face/whatsapp’s text) | Presence/absent | Item discussed |
|---|---|---|---|---|---|
| Wed | 11:00 AM | 12:00 PM | Online | Present | Talked about how to hide passwords safely |

**Plan for Next Week**
Start making the actual court booking system.

---

## Week 4
**Weekly Objectives**
Write the main code to let users book a futsal court.

**Tasks Assigned for the Week**
- Code to see if a court is available.
- Code to save a new booking.
- Code to let users see their past bookings.

**Detailed Work Description**
This was the hardest part. I had to write code that checks if a court is already taken before letting someone book it. I created the function that saves the court number, time, and price into the database. I also made a way for users to see a list of courts they already booked.

**Tools, Technologies & Resources Used**
- Node.js (Express)
- Postman

**Problems Encountered**
I didn't know how to stop two people from booking the exact same time slot on the same court.

**Solutions / Actions Taken**
I wrote an 'if' condition that checks the database first. If the start time or end time matches a booking that is already there, it shows an error "Court already booked".

**Contribution Evidence [IMPORTANT]**
- Screenshot showing "Court already booked" error in Postman.
- Code snippet of checking for overlapping time.

**Collaboration & Communication**
| Date | Start Time | End time | Mode (Online/Face-to-face/whatsapp’s text) | Presence/absent | Item discussed |
|---|---|---|---|---|---|
| Thu | 3:00 PM | 4:00 PM | Face-to-face | Present | Discussed the logic for checking booking times |

**Plan for Next Week**
Make the front part of the website (HTML/CSS) so it looks like a real website.

---

## Week 5
**Weekly Objectives**
Design the website pages so users can click buttons instead of using Postman.

**Tasks Assigned for the Week**
- Make the Home page.
- Make the Login and Register page designs.
- Make the Booking page.

**Detailed Work Description**
I spent the week writing HTML and CSS. I picked a nice dark theme color for the website because it looks sporty. I linked the HTML forms to my backend code using JavaScript (`fetch`). Now, when you click "Login", it actually talks to the database and logs you in.

**Tools, Technologies & Resources Used**
- HTML, CSS, JavaScript
- FontAwesome (for small icons)

**Problems Encountered**
The website looked good on my laptop, but when I made the screen small (like a phone), everything was messy and overlapping.

**Solutions / Actions Taken**
I searched online and learned how to use CSS Flexbox and media queries to make the website look okay on phone screens too.

**Contribution Evidence [IMPORTANT]**
- Screenshots of the homepage and the new booking page.
- Code snippet of the HTML layout.

**Collaboration & Communication**
| Date | Start Time | End time | Mode (Online/Face-to-face/whatsapp’s text) | Presence/absent | Item discussed |
|---|---|---|---|---|---|
| Mon | 1:00 PM | 2:00 PM | Online | Present | Showed the website design and asked for feedback |

**Plan for Next Week**
Build the Admin page.

---

## Week 6
**Weekly Objectives**
Create an admin dashboard and make the website send emails automatically.

**Tasks Assigned for the Week**
- Make a page that only the admin can open to manage the system.
- Show a list of all users and bookings.
- Send an automatic confirmation email using Gmail when someone books.

**Detailed Work Description**
I made a new dashboard just for the admin. I added a check in my code so that normal users can't open this page. On the dashboard, I created simple tables that list out every user and all the booked courts. After that, I used a library called Nodemailer to send a "Thank you for booking!" email automatically when a customer makes a booking. 

**Tools, Technologies & Resources Used**
- HTML, CSS, JS
- Nodemailer
- Google Gmail

**Problems Encountered**
Gmail blocked my app from sending emails because it thought it was a hacker, and it was hard to count the total money on the admin dashboard quickly.

**Solutions / Actions Taken**
I created an "App Password" in my Google Account settings to allow emails. For the dashboard, I found a way to let the database (MongoDB) do the math instead of my JavaScript code.

**Contribution Evidence [IMPORTANT]**
- Screenshot of the Admin Dashboard showing total bookings.
- Screenshot of a test email received in my inbox.

**Collaboration & Communication**
| Date | Start Time | End time | Mode (Online/Face-to-face/whatsapp’s text) | Presence/absent | Item discussed |
|---|---|---|---|---|---|
| Wed | 10:00 AM | 10:30 AM | WhatsApp | Present | Clarified what the admin needs to see and email feature |

**Plan for Next Week**
Clean up the code, test the whole website for bugs, and write instructions.

---

## Week 7
**Weekly Objectives**
Test the system, find any bugs, and write the documentation file.

**Tasks Assigned for the Week**
- Try clicking every button to find and fix bugs.
- Stop users from booking courts in the past.
- Clean up messy code and write instructions in a README file.

**Detailed Work Description**
I noticed my code was getting messy, so I organized the files properly and added comments so it's easier to read. I also wrote a `README.md` file explaining how to run the project. After that, I clicked around the website like a normal user to find bugs. I realized people could book a court for yesterday, so I added code to block past dates. 

**Tools, Technologies & Resources Used**
- Markdown (for README)
- VS Code Editor
- Chrome Browser (Testing)

**Problems Encountered**
Sometimes the date from the HTML form didn't match the date in the database because of timezone differences, and some older code didn't have comments.

**Solutions / Actions Taken**
I read through the old code and added comments. For the date problem, I made sure all dates are saved in a standard format (UTC) before sending them to the database.

**Contribution Evidence [IMPORTANT]**
- Link to the completed `README.md` file.
- Screenshot showing an error when trying to book a past date.

**Collaboration & Communication**
| Date | Start Time | End time | Mode (Online/Face-to-face/whatsapp’s text) | Presence/absent | Item discussed |
|---|---|---|---|---|---|
| Thu | 1:00 PM | 3:00 PM | Face-to-face | Present | Group testing session to find bugs and check README |

**Plan for Next Week**
Upload the project to the real server so it is live on the internet.

---

## Week 8
**Weekly Objectives**
Put the website on a real server so people can actually visit it.

**Tasks Assigned for the Week**
- Move the files to the final server.
- Install Node.js on the server.
- Make the website run in the background.

**Detailed Work Description**
This was the final step. I copied my project folder into the server. I installed all the necessary packages and set up the `.env` file with the real database passwords. I used a tool called PM2 to start the Node.js server so that if I close my terminal, the website stays online.

**Tools, Technologies & Resources Used**
- PM2 (to keep the app running)
- Ubuntu Server

**Problems Encountered**
When I typed the website address in my browser, it didn't load. The server wasn't forwarding the port correctly.

**Solutions / Actions Taken**
I had to ask for help to configure the server (Nginx) to send the internet traffic to my Node.js app on port 3000. After fixing that, it worked perfectly!

**Contribution Evidence [IMPORTANT]**
- Screenshot of the PM2 terminal showing the app is "online".
- The final URL of the live website.

**Collaboration & Communication**
| Date | Start Time | End time | Mode (Online/Face-to-face/whatsapp’s text) | Presence/absent | Item discussed |
|---|---|---|---|---|---|
| Tue | 10:00 AM | 12:00 PM | Online | Present | Help with the server port configuration |
| Fri | 3:00 PM | 3:30 PM | Online | Present | Final check of the live website |

**Plan for Next Week**
Project finished! Will prepare for the final presentation.
