# DawnBloom — Volunteer & Student Guidance Management System

> **“A new beginning. A brighter tomorrow.”**

*A college Software Engineering project designed to empower orphanage children by organizing community volunteers, educational guidance, tutoring sessions, events, tasks, and developmental programmes.*

---

## 1. Project Purpose & Mission Statement

> **“DawnBloom brings volunteers and educational guidance together to help every child discover their potential and build a brighter future.”**

Children residing in orphanage homes and youth shelters require continuous, supportive educational guidance, skill mentoring, and compassionate role models. **DawnBloom** is a complete, responsive, frontend-only management portal designed to streamline the coordination of volunteer tutors, guidance sessions, workshops, operational checklists, and student impact summaries without requiring complex server installations or recurring cloud database costs.

---

## 2. Three User Roles & Access Architecture

DawnBloom models a realistic, three-tiered community mentorship ecosystem tailored for institutional academic demonstration:

### 1. Administrator (`Administrator`)
- **Responsibilities:** Program coordinators and orphanage administrators.
- **Capabilities:**
  - Full CRUD management across volunteers, students, guidance sessions, events, tasks, and activities.
  - Analytics and RFC 4180-compliant CSV audit exports.
  - Organization-wide metrics and audit logs.
  - Ability to inspect and preview any student's personalized portal.

### 2. Volunteer Mentor (`Volunteer`)
- **Responsibilities:** Community tutors, activity facilitators, and mentors.
- **Capabilities:**
  - View **only their assigned students** in the student directory.
  - View and manage assigned tasks and checklists.
  - Schedule and record educational guidance sessions with conflict validation.
  - Access community event details and activity outcomes.

### 3. Student (`Student`)
- **Responsibilities:** Enrolled youth seeking guidance, tutoring, and skill development.
- **Capabilities:**
  - Log in using their unique **Student ID** (e.g., `STU-101`) and password.
  - Access their dedicated **Student Dashboard** (`student-dashboard.html`).
  - View their assigned mentor's profile, contact details, and guidance notes.
  - View upcoming guidance sessions scheduled exclusively for them.
  - Browse community workshops, book fairs, and activities with interactive RSVP interest.
  - Track assigned learning exercises and interactively toggle task statuses (To Do / In Progress / Completed).
  - Review learning progress metrics, completed session histories, and milestone achievement badges.
  - View and update personal study preferences and learning goals.

---

## 3. Key Features

- **Role Selection & Authentication (`login.html`):** Segmented role switcher for Admin, Volunteer, and Student with one-click demo credentials chips and automatic redirection to the correct portal.
- **Dedicated Student Registration (`register.html`):** Separate registration tab for students capturing Student Name, unique Student ID, grade level, guidance needs, and secure password.
- **Student Dashboard (`student-dashboard.html`):** Personalized student portal showing assigned mentor, upcoming sessions, assigned practice tasks, developmental events, progress meters, and milestone badges.
- **Dashboard Overview (`dashboard.html`):** Real-time coordinator metrics, upcoming events feed, volunteer engagement meters, task completion rates, and quick action shortcuts.
- **Volunteer Management (`volunteers.html`):** Complete CRUD functionality, search, filtering by status (Active/Inactive) and availability (Weekends/Weekdays), alphabetical sorting, duplicate email prevention, and full profile inspection modals.
- **Student Guidance Tracking (`students.html`):** Role-tailored views where volunteers see only their assigned mentees, while administrators retain full enrollment control.
- **Guidance Session Scheduler (`guidance.html`):** Schedule tutoring sessions with automatic end-time validation (`endTime > startTime`), volunteer overlap warning checks, and separate tabs for upcoming vs. completed sessions.
- **Events & Scheduling (`events.html`):** Multi-volunteer assignments, participant count tracking, and status transitions for community workshops.
- **Task Management (`tasks.html`):** Categorized checklists with priority indicators (High, Medium, Low), one-click complete/reopen toggles, overdue detection past current calendar date, and visual progress tracking.
- **Activities & Programmes (`activities.html`):** Curate structured programmes (Literacy, Coding, Arts) and record verified learning outcomes.
- **Reporting & Data Export (`reports.html`):** Visual SVG subject bar charts, segmented task distribution graphs, and one-click RFC 4180 compliant CSV exports for volunteers, students, sessions, events, and tasks.
- **Profile & Settings (`profile.html`):** Edit display credentials, update demonstration passwords, configure notification preferences, and restore initial seed data.

---

## 4. Technologies Used

- **HTML5:** Semantic, accessible markup structure.
- **CSS3:** Custom responsive layout, CSS variables, glassmorphism surfaces, flexbox/grid, and theme animations.
- **Vanilla JavaScript (ES6+):** Modular client-side architecture without external runtime or bundler dependencies.
- **Browser LocalStorage:** Persistent client-side data serialization via JSON.
- **Inline SVG Graphics:** Original vector icons and scalable charts with zero external asset overhead.

### Exact Visual Theme Palette

| Color Name | Hex Code | Purpose |
|---|---|---|
| **Lavender grey** | `#868092` | Subtitles, borders, and muted elements |
| **Blush pink** | `#E2C2D2` | Accents, highlights, and subtle sunrise glows |
| **Deep mauve** | `#4B3D4F` | Card headers, ambient gradients, and panel backings |
| **Dusty rose** | `#B26C86` | Primary action buttons and focus states |
| **Midnight black** | `#0C0F17` | Deep atmospheric background surface |

---

## 5. Folder & File Structure

```text
DAWNBLOOM-Volunteer Management System/
│
├── index.html                           # Root redirector & splash screen (routes by role)
├── login.html                           # Authentication sign-in portal (Admin / Volunteer / Student)
├── register.html                        # Demo account registration (Student / Volunteer / Staff)
├── dashboard.html                       # Primary administrative & volunteer dashboard
├── student-dashboard.html               # Dedicated Student Learning & Guidance Dashboard
├── volunteers.html                      # Volunteer mentor CRUD management
├── students.html                        # Student guidance records (role-filtered for volunteers)
├── guidance.html                        # Guidance session scheduling & overlap detection
├── events.html                          # Workshops & community events
├── tasks.html                           # Operational & guidance tasks
├── activities.html                      # Programmes & outcome recording
├── reports.html                         # Analytics & CSV export center
├── profile.html                         # User settings & demo data reset
│
├── css/
│   └── style.css                        # Encapsulated DawnBloom design system & student components
│
├── js/
│   ├── storage.js                       # Data Access Layer, seed data (users, students, sessions, tasks)
│   ├── auth.js                          # Session management, 3-role validation, route guard
│   ├── common.js                        # Layout, modals, role checks & toast system
│   ├── dashboard.js                     # Dashboard metrics (coordinator & volunteer modes)
│   ├── student-dashboard.js             # Student portal controller (tasks, sessions, progress)
│   ├── volunteers.js                    # Volunteer controller (admin permissions)
│   ├── students.js                      # Student controller (volunteer filtering)
│   ├── guidance.js                      # Session scheduler & overlap checks
│   ├── events.js                        # Event management controller
│   ├── tasks.js                         # Task checklist controller
│   ├── activities.js                    # Activities & outcomes controller
│   ├── reports.js                       # SVG charts & CSV generation
│   └── profile.js                       # Profile & preferences controller
│
├── docs/                                # Software Engineering deliverables
│   ├── problem-statement.md
│   ├── objectives.md
│   ├── requirements.md
│   ├── system-architecture.md
│   ├── module-description.md
│   ├── test-cases.md
│   └── limitations-and-future-enhancements.md
│
└── README.md                            # Comprehensive project manual
```

---

## 6. How to Run Locally

Because DawnBloom is built strictly with standard web technologies and relative paths, it requires **no web server, runtime installation, or compile step**:

1. Download or clone this repository to your local computer.
2. Open the project folder in File Explorer.
3. Double-click **`index.html`** to open it in any modern browser (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari).
4. Alternatively, if using VS Code, right-click `index.html` and select **"Open with Live Server"**.

---

## 7. Demo Accounts & Initial Access

The application automatically seeds demonstration accounts and records upon first launch:

### Pre-Configured Demo Accounts:
| Role | Identifier / Email | Password | Assigned Details | Target Portal |
|---|---|---|---|---|
| **Administrator** | `admin@dawnbloom.org` | `admin123` | Dr. Clara Vance (Coordinator) | `dashboard.html` |
| **Volunteer** | `volunteer@dawnbloom.org` | `volunteer123` | Sarah Jenkins (STEM Mentor, `VOL-001`) | `dashboard.html` |
| **Student (1)** | `STU-101` (or `leo@dawnbloom.org`) | `student123` | Leo M. (Grade 6, Mentored by Sarah Jenkins) | `student-dashboard.html` |
| **Student (2)** | `STU-102` (or `maya@dawnbloom.org`) | `student123` | Maya T. (Grade 4, Mentored by Marcus Vance) | `student-dashboard.html` |

*(On `login.html`, click any of the chips under **"College Demo Accounts"** to automatically fill credentials and switch tabs.)*

---

## 8. Student Registration & Login Flow

```
+-------------------------------------------------------------+
|                         login.html                          |
|  Select Role Tab:  [ Admin ]   [ Volunteer ]   [ Student ]  |
+-------------------------------------------------------------+
                               |
              +----------------+----------------+
              |                                 |
       (Admin / Volunteer)                  (Student)
              |                                 |
              v                                 v
   Enter Email & Password             Enter Student ID (e.g. STU-101)
              |                                 |
              v                                 v
   Redirects to: dashboard.html       Redirects to: student-dashboard.html
              |                                 |
   - Coordinator metrics              - Personalized welcome banner
   - All management modules           - Assigned volunteer mentor card
   - Volunteer mentee filter          - Upcoming guidance sessions
                                      - Assigned learning tasks (interactive)
                                      - Guidance progress & milestone badges
                                      - Student profile & study goals
```

### Registering a New Student:
1. Open `register.html` or click **"Register with Student ID"** on `login.html`.
2. The **Student Registration** tab activates automatically.
3. Enter Student Name (e.g. *Liam Parker*), Student ID (e.g. *STU-106*), grade level, guidance needs, and password.
4. Click **Create Student Account**.
5. The account is saved into `localStorage`, a student profile record is synchronized, and the user is logged directly into `student-dashboard.html`.

---

## 9. How LocalStorage Works

All records created in the application persist inside your browser's `localStorage` under distinct keys:
- `dawnbloom_users`: System user credentials, roles, and linked IDs.
- `dawnbloom_session`: Current active authentication token.
- `dawnbloom_volunteers`: Volunteer mentor roster.
- `dawnbloom_students`: Student guidance records.
- `dawnbloom_guidance`: Scheduled and completed tutoring sessions.
- `dawnbloom_events`: Community workshops and gatherings.
- `dawnbloom_tasks`: Operational tasks and student learning assignments.
- `dawnbloom_activities`: Educational and life skills programmes.
- `dawnbloom_preferences`: UI configuration and greeting preferences.
- `dawnbloom_activity_log`: Audit trail of system interactions.

Data persists across page reloads and browser restarts within the same browser profile.

---

## 10. How to Reset Demonstration Data

To restore the system back to its original clean state for presentation or grading:
1. Navigate to **My Profile** (`profile.html`).
2. Scroll down to the **Reset Demonstration Records** card.
3. Click **"Restore Initial Demonstration Data"** and confirm in the dialog.
4. The system will reset all collections to the pristine seed dataset including the Administrator, Volunteer, and Student accounts.

---

## 11. What Changes Were Made & GitHub Update Instructions

All updates have been made directly in your local project folder (`DAWNBLOOM-Volunteer Management System`).

### Summary of Local Folder Changes:

#### New Files Added:
1. **`student-dashboard.html`**: Complete student portal with welcome message, mentor showcase, upcoming guidance sessions, interactive practice tasks, developmental events, progress tracker, and profile editor.
2. **`js/student-dashboard.js`**: Client-side controller for the student dashboard, real-time task completion status toggles, event RSVPs, and mentor notes.

#### Modified Files:
1. **`login.html`**: Added 3-role selector tabs (Admin, Volunteer, Student), demo chips quick fill, student ID login support, and dynamic role-based redirects.
2. **`register.html`**: Added separate Student Registration form (capturing name, student ID, grade, password) alongside Volunteer/Staff registration.
3. **`index.html`**: Updated root route guard to redirect students to `student-dashboard.html`.
4. **`js/auth.js`**: Upgraded authentication to validate Student ID / Email, support role checks, guard routes against unauthorized access, and handle student registration.
5. **`js/storage.js`**: Seeded demo student accounts (`STU-101`, `STU-102`), mapped Sarah Jenkins (`VOL-001`) to `volunteer@dawnbloom.org`, seeded student learning tasks (`TSK-406`–`TSK-409`), and completed guidance history.
6. **`js/common.js`**: Added role-based redirection to keep students on `student-dashboard.html`, and enhanced sidebar navigation for anchor links.
7. **`js/students.js` & `students.html`**: Enforced volunteer view boundaries so volunteers view only their assigned students, while administrators manage all student records.
8. **`js/dashboard.js` & `dashboard.html`**: Added role-aware metrics for volunteers and added quick navigation links to the Student Portal.
9. **`js/volunteers.js`**: Restricted volunteer deletion to administrators.
10. **`js/tasks.js` & `js/guidance.js`**: Enhanced mentor workflow with auto-selection of active volunteer mentors.
11. **`css/style.css`**: Added CSS rules for role selector tabs, mentor cards, student task toggles, progress bars, and milestone badges.
12. **`README.md` & `docs/`**: Comprehensive documentation updates reflecting the three roles and student login flow.

---

### Step-by-Step Instructions to Update GitHub:

If you are using Git from your terminal, command prompt, or VS Code, follow these steps to commit and push the updates:

#### Option A: Using the Terminal / Command Prompt
```bash
# 1. Open your terminal and navigate to your project directory:
cd "C:\Users\uthra\Desktop\DAWNBLOOM-Volunteer Management System"

# 2. Check the changed and newly created files:
git status

# 3. Stage all modified and new files:
git add .

# 4. Commit your changes with a descriptive message:
git commit -m "Add Student Login system, Student Dashboard, and three-role access control"

# 5. Push the changes to your GitHub repository:
git push origin main
# (or 'git push origin master' if your default branch is master)
```

#### Option B: Using VS Code
1. Open the project folder in **Visual Studio Code**.
2. Click on the **Source Control** icon in the left activity bar (or press `Ctrl + Shift + G`).
3. You will see the newly created files (`student-dashboard.html`, `js/student-dashboard.js`) and the modified files listed under **Changes**.
4. Click the **`+` (Stage All Changes)** button at the top of the Source Control panel.
5. In the message box, type:
   `Add Student Login system, Student Dashboard, and three-role access control`
6. Click the checkmark **Commit** button (or press `Ctrl + Enter`).
7. Click **Sync Changes** (or **Push**) to upload the commits to GitHub.

#### Option C: Uploading via GitHub Web Interface (Drag and Drop)
If you do not have Git installed on your system:
1. Open your repository on [github.com](https://github.com/).
2. Click the **Add file** dropdown > **Upload files**.
3. Drag and drop the modified files (`index.html`, `login.html`, `register.html`, `dashboard.html`, `students.html`, `profile.html`, `README.md`) and the new file `student-dashboard.html`.
4. Upload the files in the `js/` folder (`js/storage.js`, `js/auth.js`, `js/common.js`, `js/student-dashboard.js`, `js/dashboard.js`, `js/students.js`, `js/volunteers.js`, `js/tasks.js`, `js/guidance.js`).
5. Upload `css/style.css` and updated files in `docs/`.
6. Add the commit message: `Add Student Login system, Student Dashboard, and three-role access control`.
7. Click **Commit changes**.

---

## 12. GitHub Pages Deployment Instructions

Deploying DawnBloom to the web takes less than two minutes:

1. Create a repository on [GitHub](https://github.com/) named `dawnbloom` (or your preferred name).
2. Push or upload all files from this directory to the repository (ensure `index.html` resides at the repository root).
3. On GitHub, navigate to **Settings** > **Pages** (in the left-hand navigation).
4. Under **Build and deployment** > **Branch**:
   - Select **`main`** (or `master`).
   - Select folder: **`/ (root)`**.
   - Click **Save**.
5. Wait 60–90 seconds for GitHub Actions to complete the deployment.
6. Open your published website link (e.g. `https://<your-username>.github.io/<repository-name>/`).
7. All relative links, role tabs, and demo accounts will function immediately.

---

## 13. Known Limitations & Prototype Disclaimer

- **Academic Prototype:** Client-side authentication in JavaScript is for demonstration and grading purposes only, **not a secure production barrier**. Browser `localStorage` cannot enforce cryptographic access restrictions.
- **Privacy Notice:** Never store real children's sensitive or confidential records in browser `localStorage`.
- **Local Scope:** Data is saved in the local browser and does not synchronize across separate physical devices.

---

## 14. Future Enhancements

- Migration to an encrypted backend REST API (Node.js/FastAPI + PostgreSQL).
- Server-side Role-Based Access Control (RBAC) and JWT authentication.
- Google Calendar (`.ics`) sync for volunteer guidance sessions.
- Real-time SMS and email push notifications for upcoming mentorship sessions.
