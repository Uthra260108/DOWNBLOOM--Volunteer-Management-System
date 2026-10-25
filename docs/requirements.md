# Software Requirements Specification (SRS) — DawnBloom

## 1. Functional Requirements (FR)

### FR-01: Authentication & Session Management
- **FR-01.1:** System shall validate demo credentials against locally stored user records in `localStorage`.
- **FR-01.2:** System shall support user account creation with email syntax validation, minimum 6-character password constraint, and duplicate-email prevention.
- **FR-01.3:** System shall provide a shared session guard redirecting unauthenticated attempts on protected pages to `login.html`.
- **FR-01.4:** System shall support password visibility toggling and user sign out.
- **FR-01.5:** System shall support three distinct user roles: Administrator, Volunteer, and Student.
- **FR-01.6:** System shall provide role selection tabs on `login.html` (Admin, Volunteer, Student) with one-click demo credentials fill for each role.
- **FR-01.7:** System shall provide a dedicated Student Registration form capturing student name, student ID, class level, password, and confirm password.
- **FR-01.8:** System shall automatically route logged-in users to the correct dashboard based on their role (Students to `student-dashboard.html`, Staff/Admins to `dashboard.html`).

### FR-02: Volunteer Management
- **FR-02.1:** System shall record volunteer ID, name, email, phone, skills, interests, availability, preferred days, join date, status, and coordinator notes.
- **FR-02.2:** System shall support search by name, email, or skill keywords, and filtering by status and availability.
- **FR-02.3:** System shall validate email uniqueness among volunteer records.
- **FR-02.4:** System shall require confirmation prior to deleting a volunteer record.

### FR-03: Student Guidance Tracking
- **FR-03.1:** System shall record student display name, age bracket, class level, subject support needs, mentor guidance goals, enrollment date, and status.
- **FR-03.2:** System shall permit assignment of active volunteers to student records.
- **FR-03.3:** System shall enable searching and filtering by grade level and support status.

### FR-04: Guidance Session Scheduling
- **FR-04.1:** System shall record session topic, subject, student ID, volunteer ID, date, start time, end time, venue, and status.
- **FR-04.2:** System shall validate that end time is strictly greater than start time.
- **FR-04.3:** System shall identify and warn against overlapping schedules for the same volunteer on identical calendar dates.
- **FR-04.4:** System shall provide separate views or filters for upcoming scheduled sessions and completed sessions.

### FR-05: Events & Scheduling
- **FR-05.1:** System shall record event name, category, date, start time, end time, location, assigned volunteer list, expected children count, status, and description.
- **FR-05.2:** System shall validate that event end time is later than start time.
- **FR-05.3:** System shall enable assignment of multiple volunteer mentors to a single event.

### FR-06: Task & Responsibility Management
- **FR-06.1:** System shall record task title, description, assigned volunteer, priority (High, Medium, Low), due date, status (To Do, In Progress, Completed), and associated event.
- **FR-06.2:** System shall allow one-click status completion and reopening.
- **FR-06.3:** System shall visually highlight overdue tasks past current date.

### FR-07: Activity & Programme Management
- **FR-07.1:** System shall record programme name, category, date, duration, target group, volunteers involved, status, and learning outcome notes.
- **FR-07.2:** System shall provide a dedicated outcome recording modal.

### FR-08: Reporting & CSV Exports
- **FR-08.1:** System shall dynamically aggregate record totals and calculate real-time completion rates.
- **FR-08.2:** System shall render responsive SVG and CSS charts for subject distribution and task fulfillment.
- **FR-08.3:** System shall generate and download CSV files for volunteers, students, guidance sessions, events, and tasks via browser Blob URLs with RFC 4180 compliant quoting.

### FR-09: Student Portal & Dashboard
- **FR-09.1:** System shall display a personalized welcome banner featuring the authenticated student's first name, Student ID, and current grade level.
- **FR-09.2:** System shall showcase the student's assigned volunteer mentor, qualifications, contact info, availability, and an interactive message modal.
- **FR-09.3:** System shall list upcoming guidance sessions scheduled exclusively for the authenticated student with venue, date, time, and session objectives.
- **FR-09.4:** System shall display upcoming developmental events and workshops with an interactive RSVP interest button.
- **FR-09.5:** System shall render assigned learning tasks and enable real-time status toggling (To Do, In Progress, Completed).
- **FR-09.6:** System shall visualize learning progress via an animated progress bar and archive completed sessions and earned milestone badges.
- **FR-09.7:** System shall display student profile attributes and provide an interactive modal to update study preferences and learning goals.
- **FR-09.8:** System shall enforce interface access boundaries: students only view their own records; volunteers view their assigned students; administrators manage all records.

---

## 2. Non-Functional Requirements (NFR)

### NFR-01: Performance & Responsiveness
- The application shall load all views within 500 milliseconds under standard modern browser conditions without external network asset blocking.
- The user interface shall adapt smoothly across desktop screens (>=1024px), tablets (768px–1023px), and mobile devices (<=767px).

### NFR-02: Zero-Dependency Portability
- The application shall operate purely via standard HTML5, CSS3, and ECMAScript 6+ Vanilla JavaScript.
- No build tools, compilers (e.g. Webpack, Babel), backend runtimes (e.g. Node.js, Python), or external web APIs shall be required.

### NFR-03: Safe DOM Rendering
- All user-supplied inputs shall pass through HTML character entity escaping (`&`, `<`, `>`, `"`, `'`) before being inserted into DOM innerHTML to prevent client-side script injection.

### NFR-04: Theme & Visual Harmony
- The interface shall strictly apply the designated DawnBloom color palette and avoid unstyled or default browser controls.
