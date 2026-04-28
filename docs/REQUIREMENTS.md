# 🏥 B2B Healthcare SaaS — Frontend Assignment (Medicore)

## Objective

Build a frontend application that simulates a healthcare SaaS platform. The focus is on **UI quality, state management, and scalable architecture**, not backend complexity.

---

## Tech Stack (Required)

* React
* TypeScript
* State Management (Redux / Zustand / Context API)

---

## Core Features

### 1. Authentication

* Implement login using Firebase Authentication
* Handle:

  * Form validation
  * Error states (invalid credentials, network issues)
  * Session persistence (user stays logged in on refresh)
* Protect private routes (redirect unauthenticated users)

---

### 2. Application Pages

Implement the following pages:

#### • Login Page

* Clean UI with validation states
* Loading + error handling

#### • Dashboard Page

* Display summary cards:

  * Total Patients
  * Upcoming Appointments
  * Revenue (mocked)
* Include at least one simple chart (line/bar)

#### • Analytics Page

* Visualize data using charts
* Provide basic filtering (e.g., date range)

#### • Patient Details Page

* Display patient dataset (mocked/static API)

---

### 3. Patient Module

* Display patients in:

  * Grid View
  * List View
* Provide toggle between views
* Include:

  * Search (by name/ID)
  * Basic filters (optional but high value)
* Ensure responsiveness and clean UI states (empty, loading)

---

### 4. Notifications (Service Worker)

* Implement a service worker
* Enable local/push notifications
* Demonstrate at least one use case:

  * Example: “Upcoming appointment reminder”

---

### 5. State Management

* Centralize application state
* Manage:

  * Auth state
  * Patient data
  * UI state (filters, toggles)
* Ensure clean data flow and separation of concerns

---

## Bonus (High Signal, Optional)

*(Pick 1–2 max; don’t overbuild)*

* Reusable component system (buttons, cards, layouts)
* Performance optimizations:

  * Lazy loading routes
  * Memoization
* Micro-frontend architecture (only if you truly understand it)
* API abstraction layer (services/hooks)

---

## Expectations (Important)

* Use mocked APIs or static JSON (no backend required)
* Focus on **clarity over complexity**
* Handle edge cases:

  * Loading states
  * Empty states
  * Error states

---

## Evaluation Criteria

You will be evaluated on:

* **Code Quality** — Structure, readability, maintainability
* **UI/UX** — Clean design, responsiveness, usability
* **State Management** — Proper data flow and separation
* **Architecture Thinking** — Scalability and organization
* **Feature Completeness** — Meets core requirements
* **Performance Awareness** — Avoid unnecessary re-renders

---

## Submission Guidelines

* Upload code to a GitHub repository
* Provide a live deployed link (Vercel / Netlify)
* Ensure the app is fully functional

---

## Submission Process

* Submit:

  * GitHub repo
  * Live link
* Complete application form
* Share all required details
