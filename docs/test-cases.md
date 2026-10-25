# Software Engineering Test Cases — DawnBloom

This document details the test suites, procedures, and verification results across all functional and non-functional requirements.

---

## Test Suite 1: Authentication & Route Guarding

| Test ID | Test Scenario | Preconditions | Test Steps | Expected Result | Result |
|---|---|---|---|---|---|
| **TC-AUTH-01** | Unauthenticated route protection | No active session in `localStorage` | Direct browser address bar navigation to `dashboard.html` | System redirects to `login.html?redirect=dashboard.html` | **PASS** |
| **TC-AUTH-02** | Initial demo login with Admin account | Default seed data present | Enter `admin@dawnbloom.org` and `admin123`, click Sign In | Toast confirms success; user redirected to `dashboard.html` with Dr. Clara Vance profile | **PASS** |
| **TC-AUTH-03** | Invalid credential rejection | On `login.html` | Enter valid email with incorrect password | Form displays error feedback; login blocked | **PASS** |
| **TC-AUTH-04** | User registration validation | On `register.html` | Enter duplicate email `admin@dawnbloom.org` | Rejects with message that email already exists | **PASS** |
| **TC-AUTH-05** | Successful account registration | On `register.html` | Enter new name, valid email, matching 6+ char passwords | Account created, session initiated, redirected to dashboard | **PASS** |
| **TC-AUTH-06** | Session logout | Logged in on any dashboard page | Click sidebar sign out button and confirm in dialog | Session cleared from `localStorage`; redirected to `login.html` | **PASS** |

---

## Test Suite 2: Volunteer Management (CRUD & Filters)

| Test ID | Test Scenario | Preconditions | Test Steps | Expected Result | Result |
|---|---|---|---|---|---|
| **TC-VOL-01** | Add new volunteer record | Logged in on `volunteers.html` | Click "Add Volunteer", fill required fields, submit | New record appended to table and stored in `dawnbloom_volunteers` | **PASS** |
| **TC-VOL-02** | Prevent duplicate volunteer email | On `volunteers.html` | Add volunteer using existing email `sarah.jenkins@example.org` | Form submission rejected with duplicate email toast warning | **PASS** |
| **TC-VOL-03** | Edit volunteer profile | On `volunteers.html` | Click "Edit" on volunteer row, change status to Inactive, submit | Table immediately updates status badge to Inactive; persisted | **PASS** |
| **TC-VOL-04** | Filter volunteers by status | On `volunteers.html` | Select "Inactive" from Status filter dropdown | Only inactive volunteers display in table; counter updates | **PASS** |
| **TC-VOL-05** | Delete volunteer with confirmation | On `volunteers.html` | Click "Delete", confirm in custom dialog | Volunteer removed from table and storage; activity logged | **PASS** |

---

## Test Suite 3: Student Guidance Management

| Test ID | Test Scenario | Preconditions | Test Steps | Expected Result | Result |
|---|---|---|---|---|---|
| **TC-STU-01** | Enroll new student | Logged in on `students.html` | Click "Enroll Student", enter display name, select age group & grade, submit | Student profile appears in roster with correct grade badge | **PASS** |
| **TC-STU-02** | Assign volunteer mentor | On `students.html` | Edit student, select "Marcus Vance" from dropdown, save | Mentor name displayed alongside student row | **PASS** |
| **TC-STU-03** | View student details modal | On `students.html` | Click "View" button on student row | Modal opens displaying full guidance notes and learning goals | **PASS** |
| **TC-STU-04** | Filter students by education level | On `students.html` | Select "Grade 4" from level filter dropdown | Only Grade 4 student records displayed | **PASS** |

---

## Test Suite 4: Guidance Sessions & Validation

| Test ID | Test Scenario | Preconditions | Test Steps | Expected Result | Result |
|---|---|---|---|---|---|
| **TC-GID-01** | End time after start time validation | On `guidance.html` | Set Start Time `14:00` and End Time `13:00`, submit | Rejection error: "Session End Time must be later than Start Time." | **PASS** |
| **TC-GID-02** | Overlap warning detection | On `guidance.html` | Schedule same mentor for overlapping time interval on same date | System displays modal warning of schedule overlap | **PASS** |
| **TC-GID-03** | Separate upcoming & completed tabs | On `guidance.html` | Click "Completed Sessions" tab | Only sessions with status `Completed` are rendered in table | **PASS** |
| **TC-GID-04** | One-click session completion | On `guidance.html` | Click "Complete" button on scheduled session | Status updates to Completed, toast confirms, dashboard updates | **PASS** |

---

## Test Suite 5: Events, Tasks & Programmes

| Test ID | Test Scenario | Preconditions | Test Steps | Expected Result | Result |
|---|---|---|---|---|---|
| **TC-EVT-01** | Multi-volunteer event assignment | On `events.html` | Check two volunteers in modal and save | Event card displays both volunteer names under assigned section | **PASS** |
| **TC-TSK-01** | Toggle task status checkbox | On `tasks.html` | Click checkbox next to "To Do" task | Task transitions to Completed; completion bar increases | **PASS** |
| **TC-TSK-02** | Overdue task highlight | On `tasks.html` | Task with past due date and non-completed status | Card renders with red overdue badge and accent border | **PASS** |
| **TC-ACT-01** | Record activity outcome | On `activities.html` | Click "Record Outcome", type notes, submit | Card outcome box immediately reflects newly documented results | **PASS** |

---

## Test Suite 6: Reporting & CSV Exports

| Test ID | Test Scenario | Preconditions | Test Steps | Expected Result | Result |
|---|---|---|---|---|---|
| **TC-REP-01** | Live statistics aggregation | On `reports.html` | Review metric cards against stored collections | Metrics reflect true counts from localStorage without hardcoding | **PASS** |
| **TC-REP-02** | CSV generation & quotation | On `reports.html` | Click "Export Volunteers CSV" | Browser triggers download of RFC-compliant `.csv` file with quoted fields | **PASS** |
| **TC-REP-03** | SVG Subject Bar Chart | On `reports.html` | Inspect Guidance Sessions chart DOM | Scalable SVG bars render correctly scaled to subject distribution | **PASS** |

---

## Test Suite 7: Settings & Data Reset

| Test ID | Test Scenario | Preconditions | Test Steps | Expected Result | Result |
|---|---|---|---|---|---|
| **TC-SET-01** | Profile name update | On `profile.html` | Edit name, submit form | Display name and sidebar badge update immediately | **PASS** |
| **TC-SET-02** | Reset demonstration data | On `profile.html` | Click "Restore Initial Demonstration Data", confirm dialog | Collections reset to initial 5 volunteers, 5 students, 4 events, etc. | **PASS** |

---

## Test Suite 8: Student Portal, Registration & Role-Based Access

| Test ID | Test Scenario | Preconditions | Test Steps | Expected Result | Result |
|---|---|---|---|---|---|
| **TC-STU-AUTH-01** | Student login with Student ID | On `login.html` | Select Student tab, enter `STU-101` and `student123`, submit | Redirected to `student-dashboard.html`; welcome banner greets Leo M. | **PASS** |
| **TC-STU-AUTH-02** | Student registration flow | On `register.html` | Fill Student Registration form with ID `STU-106`, grade 7, password | Account saved, student profile generated, auto-logged into student portal | **PASS** |
| **TC-STU-DASH-01** | Assigned mentor display | Logged in as student `STU-101` | Inspect Student Dashboard mentor section | Displays Sarah Jenkins profile, STEM expertise, availability, and message button | **PASS** |
| **TC-STU-DASH-02** | Upcoming sessions filtering | Logged in as student `STU-101` | Inspect Guidance Sessions section | Only sessions for Leo M. (`STU-101`) are rendered; other students' sessions excluded | **PASS** |
| **TC-STU-DASH-03** | Interactive task status toggle | Logged in as student `STU-101` | Click "Mark as Completed" on task `TSK-406` | Status updates to Completed, success toast shows, progress percentage recalculates | **PASS** |
| **TC-STU-DASH-04** | Interface-level route boundary | Logged in as student | Manually type `students.html` or `dashboard.html` in URL | Route guard automatically redirects student back to `student-dashboard.html` | **PASS** |
| **TC-STU-DASH-05** | Volunteer role student filter | Logged in as volunteer `volunteer@dawnbloom.org` | Open `students.html` | Only assigned mentees (Leo M.) displayed; "Add Student" button hidden | **PASS** |

