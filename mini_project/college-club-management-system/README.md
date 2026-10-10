# ClubSphere — College Club Management System

ClubSphere is a responsive campus community platform built with React + Vite, Express, MongoDB and Mongoose. It supports student discovery, club applications, administrator approvals, event publication, attendance, and lifecycle management.

## Main workflows

### Students
- Register and verify an email address with a one-time verification code.
- Recover forgotten passwords using one-time, hashed reset tokens with a 20-minute expiry.
- Discover clubs grouped by department; clubs without a department appear under **Other clubs**.
- Apply to join clubs, track membership requests, leave a club and reapply after a rejection or leaving.
- Register for events. When capacity is full, the student joins a waitlist and is automatically promoted when a registered attendee cancels.
- Add approved events to a calendar (.ics), open the event location/map link, view organiser contact details and submit post-event feedback.
- Check in at an event with a QR link when registered, signed in and within the event check-in window.

### Club representatives (`club_manager`)
- Select **Club representative** when registering and verify the account email.
- Submit a detailed club application containing department, description, public contact details, website/social link, logo URL and key leadership members.
- Wait for administrator approval before the club is publicly listed or event proposals can be submitted.
- Edit the club profile and key-member details after approval.
- Create event proposals with venue, date/time, map link and organiser contacts; proposals remain hidden until approved by an administrator.
- Request club deletion with a seven-day grace period. A deletion-pending club is hidden immediately and can be restored during the grace period.
- Manage membership requests for the club and review event feedback.

### Administrators
- View system metrics, a full club directory and a review queue.
- Inspect club dossiers, including owner/contact information, key members, event history and membership records.
- Approve/reject club applications and event proposals, with a review note on rejection.
- Schedule active-club deletion or cancel a deletion during the seven-day grace period.
- Assign verified faculty/student coordinator accounts to approved clubs from the full club dossier. Revise rejected club applications and rejected event proposals, then resubmit them for review.
- Review attendance, manage memberships, and publish campus-wide announcements.

### Coordinators
- Manage assigned clubs only, with backend checks on club access for membership reviews, events, announcements, feedback and attendance.

## Requirements

- Node.js 22.12+ (required by the current Vite toolchain)
- MongoDB local instance or MongoDB Atlas
- An email sender for verification and password recovery

## Local setup on Windows (CMD)

Open two terminals from the project folder.

### 1. Backend

```cmd
cd backend
npm install
copy .env.example .env
notepad .env
```

Set `MONGO_URI`, `JWT_SECRET` (at least 24 characters), `CLIENT_URL` (usually `http://localhost:5173`), `EMAIL_USER` and `EMAIL_APP_PASSWORD`. Enter the Gmail App Password without spaces. Keep `.env` private.

Start the API:

```cmd
npm run dev
```

The API listens on port `5000` by default and waits for MongoDB. Check `http://localhost:5000/api/health` if the app cannot connect.

To promote an existing verified account to admin, run this from `backend`:

```cmd
npm run make-admin -- user@example.com
```

### 2. Frontend

```cmd
cd frontend
npm install
copy .env.example .env
notepad .env
```

Set `VITE_API_BASE_URL=http://localhost:5000/api` for local development, then run:

```cmd
npm run dev
```

Vite usually serves the app at `http://localhost:5173`.

## Hosted email configuration (Render Free)

Render Free web services block outbound SMTP ports `25`, `465`, and `587`. Use the HTTPS email API integration rather than Gmail SMTP for the hosted application. See Render's [free web service limitations](https://render.com/docs/free).

This project supports Brevo's transactional email API. In Brevo, create an API key and add/verify a sender address first. Brevo requires the sender used in API requests to be registered and verified; see its [transactional email API documentation](https://developers.brevo.com/docs/send-a-transactional-email).

Set these variables in the Render backend service's Environment settings:

- `EMAIL_PROVIDER=brevo`
- `BREVO_API_KEY` = your private Brevo API key
- `EMAIL_FROM` = the verified sender address in Brevo
- `EMAIL_FROM_NAME=ClubSphere`

Do not store these values in GitHub or paste the API key into public issue threads. `EMAIL_USER` and `EMAIL_APP_PASSWORD` remain useful for local development when `EMAIL_PROVIDER=smtp`.

## Attendance and QR notes

The attendance workspace provides a QR check-in link and a CSV export of registrations, waitlist entries and attendance. Only authenticated students with an active event registration can check in; the API enforces the check-in window. The current QR image is rendered through an external QR-image service; for production use, replace it with a locally generated QR code to remove that external dependency.

The default local QR URL uses `CLIENT_URL`. Scanning from a phone will not work if the QR points to the phone's own `localhost`; for a same-network demo, configure the frontend to be reachable at the computer's LAN address and set `CLIENT_URL` to that address. In production, set it to the deployed frontend URL.

## Useful scripts

Frontend: `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`

Backend: `npm run dev`, `npm start`, `npm test`, `npm run make-admin -- user@example.com`

## Deployment notes

Set `VITE_API_BASE_URL` in the frontend hosting environment to the deployed backend URL ending in `/api`. Set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `CLIENT_URLS`, and the email API variables in the backend environment. Do not commit `.env` files, database credentials, email API keys, app passwords, or generated attendance URLs.

The frontend retains the existing localStorage bearer-token flow. Treat it as a known security trade-off and do not inject untrusted HTML. The scheduled deletion process runs at backend startup and hourly while the server is running; due clubs and their related events, registrations, feedback, memberships and announcements are purged at that time.
