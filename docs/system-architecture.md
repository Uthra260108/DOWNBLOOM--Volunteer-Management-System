# System Architecture & Diagrams — DawnBloom

## 1. Architectural Overview

DawnBloom adopts a **modular frontend-only architecture**. The presentation layer consists of semantic HTML5 views styled with an encapsulated CSS3 design system. User interactions are dispatched to discrete JavaScript controller modules which delegate persistence, data serialization, and validation to a centralized `storage.js` layer interacting directly with the browser's `localStorage` engine.

```mermaid
flowchart TD
  subgraph Presentation ["Presentation Layer (HTML5 Views)"]
    V1[index.html / login.html / register.html]
    V2[dashboard.html / student-dashboard.html]
    V3[volunteers.html / students.html]
    V4[guidance.html / events.html]
    V5[tasks.html / activities.html / profile.html / reports.html]
  end

  subgraph Controllers ["UI & Business Logic (Vanilla JS Modules)"]
    C1[auth.js / common.js]
    C2[dashboard.js / student-dashboard.js]
    C3[volunteers.js / students.js]
    C4[guidance.js / events.js]
    C5[tasks.js / activities.js / profile.js / reports.js]
  end

  subgraph CoreServices ["Core Services & Storage Layer"]
    S1[storage.js - Data Access Object]
    S2[DOM Sanitizer - escapeHtml]
    S3[Audit Logger - logActivity]
    S4[Blob CSV Exporter]
  end

  subgraph BrowserStorage ["Browser Storage Engine"]
    LS[(Browser LocalStorage Engine)]
  end

  Presentation --> Controllers
  Controllers --> CoreServices
  CoreServices --> BrowserStorage
```

---

## 2. Use Case Diagram

```mermaid
flowchart LR
  Coordinator((Program Coordinator / Admin))
  Volunteer((Volunteer Mentor))
  StudentActor((Student))

  subgraph SystemBoundary ["DawnBloom System Boundary"]
    UC1[Sign In & Role Selection]
    UC2[Manage Volunteers CRUD]
    UC3[Enroll & Assign Students]
    UC4[Schedule Guidance Sessions]
    UC5[Validate Schedule Conflicts]
    UC6[Manage Events & Workshops]
    UC7[Track Operational Tasks]
    UC8[Record Activity Outcomes]
    UC9[Export CSV Reports]
    UC10[Update Profile & Demo Data]
    UC11[Access Student Dashboard]
    UC12[View Assigned Mentor Profile]
    UC13[View My Guidance Sessions]
    UC14[Toggle Learning Task Status]
    UC15[RSVP Events & Track Progress]
  end

  Coordinator --> UC1
  Coordinator --> UC2
  Coordinator --> UC3
  Coordinator --> UC4
  Coordinator --> UC5
  Coordinator --> UC6
  Coordinator --> UC7
  Coordinator --> UC8
  Coordinator --> UC9
  Coordinator --> UC10
  Coordinator --> UC11

  Volunteer --> UC1
  Volunteer --> UC3
  Volunteer --> UC4
  Volunteer --> UC7
  Volunteer --> UC8
  Volunteer --> UC10

  StudentActor --> UC1
  StudentActor --> UC11
  StudentActor --> UC12
  StudentActor --> UC13
  StudentActor --> UC14
  StudentActor --> UC15
```

---

## 3. Navigation & Screen Flow Diagram

```mermaid
flowchart TD
  Start([Launch index.html]) --> CheckAuth{Session Active?}
  CheckAuth -- No --> Login[login.html]
  CheckAuth -- Yes --> RoleCheck{User Role?}
  RoleCheck -- Student --> StudentDash[student-dashboard.html]
  RoleCheck -- Admin or Volunteer --> Dashboard[dashboard.html]

  Login -->|Register Student| RegStudent[register.html?role=student]
  Login -->|Register Staff| RegStaff[register.html?role=volunteer]
  RegStudent -->|Auto-login| StudentDash
  RegStaff -->|Auto-login| Dashboard

  Login -->|Student Login| StudentDash
  Login -->|Staff Login| Dashboard

  Dashboard --> Volunteers[volunteers.html]
  Dashboard --> Students[students.html]
  Dashboard --> Guidance[guidance.html]
  Dashboard --> Events[events.html]
  Dashboard --> Tasks[tasks.html]
  Dashboard --> Activities[activities.html]
  Dashboard --> Reports[reports.html]
  Dashboard --> Profile[profile.html]
  Dashboard -.->|Preview Portal| StudentDash

  Profile -->|Logout| Login
  StudentDash -->|Logout| Login
```

---

## 4. Guidance Session Scheduling Activity Flow

```mermaid
flowchart TD
  A[User clicks 'Schedule Session'] --> B[Open Guidance Modal]
  B --> C[Fill Title, Student, Mentor, Date, Start & End Time]
  C --> D[Submit Form]
  D --> E{Is End Time > Start Time?}
  E -- No --> F[Display Error: End time must be later than start time]
  F --> C
  E -- Yes --> G{Overlap Check: Does volunteer have another session on Date within time interval?}
  G -- Yes --> H[Display Overlap Warning Modal]
  H -->|User confirms override| I[Generate Unique ID & Append to dawnbloom_guidance]
  H -->|User cancels| C
  G -- No --> I
  I --> J[Save to LocalStorage]
  J --> K[Append Audit Log]
  K --> L[Show Success Toast & Refresh Table]
```
