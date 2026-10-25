# Module Description — DawnBloom

This document details each functional subsystem and script module comprising the DawnBloom platform.

---

## 1. Core Storage Module (`js/storage.js`)
- **Purpose:** Acts as the Data Access Object (DAO) interfacing between in-memory JavaScript objects and the browser's persistent `localStorage`.
- **Storage Keys Managed:**
  - `dawnbloom_users`: Registered user credentials and profiles.
  - `dawnbloom_session`: Current active authentication token/session.
  - `dawnbloom_volunteers`: Volunteer mentor roster.
  - `dawnbloom_students`: Student guidance records.
  - `dawnbloom_guidance`: Scheduled and completed tutoring sessions.
  - `dawnbloom_events`: Community workshops and gatherings.
  - `dawnbloom_tasks`: Operational tasks and checklists.
  - `dawnbloom_activities`: Educational and life skills programmes.
  - `dawnbloom_preferences`: UI configuration and greeting preferences.
  - `dawnbloom_activity_log`: Audit trail of system interactions.
- **Key Functions:**
  - `getCollection(key)`: Safely reads and parses JSON from storage.
  - `saveCollection(key, data)`: Serializes records with quota error traps.
  - `addItem(key, item)`: Generates prefixed IDs and prepends new entries.
  - `updateItem(key, id, updatedFields)`: Modifies existing records and timestamps.
  - `deleteItem(key, id)`: Removes records and records audit logs.
  - `escapeHtml(str)`: Sanitizes text against DOM injection.
  - `seedInitialData(force)`: Populates initial sample records upon first launch.

---

## 2. Authentication & Session Module (`js/auth.js`)
- **Purpose:** Manages user authentication flow, demo credentials validation, role enforcement (Administrator, Volunteer, Student), session tracking, and route guarding.
- **Key Functions:**
  - `requireAuth(allowedRoles)`: Guards protected pages; verifies role permissions; redirects unauthorized access or unauthenticated requests.
  - `requireGuest()`: Redirects authenticated users accessing login or register directly to their role-appropriate dashboard (`student-dashboard.html` for Students, `dashboard.html` for Staff/Admins).
  - `login(identifier, password, rememberMe, expectedRole)`: Authenticates against `dawnbloom_users` using Email or Student ID, with role verification.
  - `register(userData)`: Registers a new Volunteer or Administrator demonstration account.
  - `registerStudent(studentData)`: Registers a new Student demo account and synchronizes their student profile in `dawnbloom_students`.
  - `logout()`: Clears active session and redirects to sign-in.
  - `setupPasswordToggle()`: Toggles masked password inputs with SVG eye icons.

---

## 3. Shared UI Controller (`js/common.js`)
- **Purpose:** Centralizes layout behaviors shared across all authenticated pages.
- **Key Functions:**
  - `showToast(message, type, duration)`: Injects and auto-dismisses animated toasts (success, error, warning, info).
  - `confirm(options)`: Promises-based custom confirmation modal replacing blocking browser alerts.
  - `initLayout()`: Syncs current date display, populates user avatar and badge in sidebar, handles mobile off-canvas toggles, and highlights the active navigation menu item.
  - `formatDate() / formatTime()`: Standardizes human-friendly date and time strings.

---

## 4. Dashboard Controller (`js/dashboard.js`)
- **Purpose:** Dynamically aggregates statistics across all collections and populates summary widgets.
- **Key Functions:**
  - `loadDashboardData()`: Computes total and active volunteers, enrolled students, upcoming events, scheduled guidance, and pending task totals.
  - `renderUpcomingEvents()`: Renders upcoming events ordered by date.
  - `renderTaskBreakdown()`: Calculates task completion percentages and status counts.
  - `renderVolunteerParticipation()`: Displays active volunteer engagement and tutoring frequencies.

---

## 5. Volunteer Management Module (`js/volunteers.js`)
- **Purpose:** Full CRUD operations for community mentors.
- **Key Functions:**
  - Renders searchable, filterable, and sortable roster tables.
  - Validates duplicate emails.
  - Offers a detail view modal summarizing skills, availability, and coordinator notes.

---

## 6. Student Guidance Module (`js/students.js`)
- **Purpose:** Manages student records receiving educational guidance.
- **Key Functions:**
  - Captures grade level, age group, learning difficulties, and mentor assignment.
  - Generates dynamically populated volunteer tutor assignment selectors.

---

## 7. Guidance Session Controller (`js/guidance.js`)
- **Purpose:** Orchestrates individual and small-group tutoring sessions.
- **Key Functions:**
  - `handleFormSubmit()`: Performs chronological validation (`endTime > startTime`).
  - Detects schedule overlaps for the same volunteer on identical calendar dates and prompts confirmation.
  - Provides tab switching between "Upcoming Scheduled", "Completed", and "All Records".

---

## 8. Events & Scheduling Module (`js/events.js`)
- **Purpose:** Coordinates workshops, book fairs, and community gatherings.
- **Key Functions:**
  - Allows assignment of multiple volunteer mentors through checkboxes.
  - Validates start/end times and tracks expected participant counts.
  - Provides status transitions (`Scheduled`, `Completed`, `Cancelled`).

---

## 9. Task Management Module (`js/tasks.js`)
- **Purpose:** Tracks logistical preparation items and volunteer assignments.
- **Key Functions:**
  - Provides one-click checkbox status toggles between `To Do` and `Completed`.
  - Flags overdue tasks past current date with highlighted styling.
  - Displays real-time task completion ratios.

---

## 10. Activities & Programmes Module (`js/activities.js`)
- **Purpose:** Oversees recurring developmental curricula (e.g. Reading Circle, Coding Club).
- **Key Functions:**
  - Provides a dedicated "Record Outcome" modal to document educational impact and observations.
  - Categorizes programmes into Literacy, Skills, Arts, and Career Awareness.

---

## 11. Reports & Data Export Module (`js/reports.js`)
- **Purpose:** Generates visual charts and browser-based CSV downloads without external libraries.
- **Key Functions:**
  - `renderGuidanceSubjectsChart()`: Generates responsive inline SVG bar charts.
  - `renderTaskStatusChart()`: Generates proportional segmented progress bars.
  - `downloadCSV()`: Employs RFC 4180 quotation and `Blob` URL generation to download CSV files for volunteers, students, sessions, events, and tasks.

---

## 12. Profile & Settings Module (`js/profile.js`)
- **Purpose:** Manages user settings, password updates, and system data resets.
- **Key Functions:**
  - Validates and saves profile name and email modifications.
  - Changes demo passwords with verification of current password.
  - Implements the "Restore Initial Demonstration Data" functionality with confirmation.

---

## 13. Student Dashboard Controller (`js/student-dashboard.js`)
- **Purpose:** Manages the dedicated student-facing portal, providing personalized learning access and interactive goal tracking.
- **Key Functions:**
  - `loadMentorDetails()`: Resolves the student's assigned volunteer tutor and displays qualifications, availability, and contact options.
  - `renderUpcomingSessions()`: Displays tutoring classes scheduled exclusively for the logged-in student.
  - `renderAssignedTasks()`: Renders interactive task cards allowing students to toggle task completion status in real-time.
  - `renderProgressAndMilestones()`: Computes completion percentages, archives session history logs, and displays earned guidance badges.
  - `renderProfileSection()`: Presents student information and provides an interactive modal to edit study goals and preferred subjects.
  - `toggleEventRSVP()`: Enables students to register attendance interest for workshops and book fairs.
  - `setupModals()`: Controls the "Send Note to Mentor" and "Session Details" modal dialogs.
