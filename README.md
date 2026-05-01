# Medicore

Medicore is a frontend healthcare SaaS demo built with React, TypeScript, Firebase Authentication, Firestore, Context API, and Vite.

The app simulates a clinic workspace for admins, doctors, and staff. It uses mocked patient/user data for the main interface and Firestore for appointments.

## Pages

### Landing

The public landing page introduces the product and links users to the login flow. The sidebar is never shown on this page.

### Login

The login page uses Firebase Authentication. It includes form validation, loading states, and error handling for failed sign-in attempts.

### Dashboard

The dashboard changes by role:

- Admins see operational metrics, patient snapshots, analytics-style activity, and the user directory.
- Doctors see their profile, visit metrics, notification status, and their upcoming appointments.
- Staff see their profile, visits in the last 7 days, and the schedule appointments calendar.

The dashboard also includes mocked summary metrics such as total patients, upcoming appointments, and revenue.

### Patients

The patients page shows patient records in grid and list views. Users can search, filter, sort, paginate, and open patient details.

### Analytics

The analytics page visualizes mocked patient data with charts and filters for date range, visit type, and patient status.

## Demo Credentials

New user accounts cannot be created from the app. Use one of the seeded demo accounts below.

All seeded users use the same password:

```text
MediCore@123
```

Useful demo accounts:

```text
Admin:
aarav.mehta@medicore.example

Staff:
maya.iyer@medicore.example

Doctor:
kavita.menon@medicore.example
```

More demo users are available in:

- `src/data/admins.ts`
- `src/data/staff.ts`
- `src/data/doctors.ts`

## How To Use

### Open Patient Details

Go to the Patients page and click any patient card or table row. A details drawer opens from the side with profile, insurance, visits, and notes.

### Open Visit Details

Inside the patient details drawer, click a visit in either Timeline or Detail mode. A visit modal opens with symptoms, diagnosis, prescription, vitals, and visit metadata.

### Schedule Appointments

Log in as a staff user, then open the Dashboard.

1. Go to the Schedule Appointments tab.
2. Click a date in the calendar.
3. Select a patient and doctor from the dropdowns.
4. Save the appointment.

The appointment is stored in the Firestore `APPOINTMENTS` collection.

### View Appointments As A Doctor

Log in as the doctor selected for an appointment.

1. Open the Dashboard.
2. Go to the Upcoming Appointments tab.
3. The appointment appears on the doctor calendar with the patient name.

Doctors only see appointments assigned to them.

## Notifications

Medicore uses a service worker and browser notifications for appointment alerts.

For the demo flow:

1. Log in as a doctor.
2. Open the Dashboard.
3. Enable notifications when prompted or from the notification status section.
4. Keep the doctor dashboard open.
5. Schedule an appointment for that doctor from a staff account.
6. The doctor should receive a browser notification.

This is a frontend-only demo using realtime appointment listening. It is not a server-side FCM push implementation, so the doctor session needs to be open for appointment notifications to trigger.

## Troubleshooting Notifications

If notifications do not appear:

- Check that browser notifications are enabled for the site.
- Check the browser site settings if permission was previously blocked.
- Make sure the app is running on HTTPS when deployed.
- Keep the doctor dashboard open while testing.
- Confirm the appointment was scheduled for the same doctor account currently logged in.
- Try the test notification button in the doctor dashboard.

On mobile, browser notification behavior depends on the browser and operating system. Android Chrome is usually easier for this demo. iOS Safari can require stricter setup and may need the site installed to the Home Screen for web-app notification behavior.

## Local Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Routing On Vercel

The project includes `vercel.json` so direct visits and refreshes on client routes such as `/dashboard`, `/patients`, and `/analytics` resolve through `index.html`.
