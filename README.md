# DawnBloom — Volunteer & Student Guidance Management System

**A new beginning. A brighter tomorrow.**

## Overview

DawnBloom is a frontend-based web application designed to simplify volunteer coordination and educational guidance management for orphanages. It helps organize volunteers, students, mentoring sessions, events, tasks, and educational activities through a centralized interface.

The project aims to support better coordination of volunteer services and educational programmes that help children learn, grow, and develop their potential.

## Features

- **User Authentication:** Registration, login, and logout for demonstration purposes.
- **Dashboard:** Overview of volunteers, students, upcoming events, guidance sessions, and pending tasks.
- **Volunteer Management:** Add, view, update, search, filter, and delete volunteer records.
- **Student Management:** Maintain student-support records and assign volunteers.
- **Guidance Sessions:** Schedule and track educational and mentoring sessions.
- **Event Management:** Create, update, and manage educational workshops and community events.
- **Task Management:** Assign responsibilities, set priorities, and monitor task completion.
- **Activities & Programmes:** Organize and track educational and support activities.
- **Reports:** View application summaries and export records to CSV files.
- **Profile Management:** Update profile details and application preferences.
- **Data Persistence:** Save application records in browser localStorage.
- **Responsive Interface:** Support desktop, tablet, and mobile screens.

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Browser localStorage
- CSV export using JavaScript
- GitHub Pages

The application does not require a backend server or database.

## Project Structure

```text
DawnBloom/
├── index.html
├── login.html
├── register.html
├── dashboard.html
├── volunteers.html
├── students.html
├── guidance.html
├── events.html
├── tasks.html
├── activities.html
├── reports.html
├── profile.html
├── css/
│   └── style.css
├── js/
│   ├── storage.js
│   ├── auth.js
│   ├── common.js
│   ├── dashboard.js
│   ├── volunteers.js
│   ├── students.js
│   ├── guidance.js
│   ├── events.js
│   ├── tasks.js
│   ├── activities.js
│   ├── reports.js
│   └── profile.js
├── docs/
└── README.md
```

*The folder structure may vary depending on the final implementation.*

## Installation and Usage

1. Clone or download this repository.
2. Open the project folder in Visual Studio Code.
3. Open `index.html` in a web browser. Alternatively, use the VS Code Live Server extension.
4. Register a demonstration account.
5. Log in and explore the application's features.

No additional package installation or database configuration is required.

## Deployment

DawnBloom can be deployed using GitHub Pages.

1. Create a repository on GitHub.
2. Upload the project files to the repository.
3. Navigate to **Settings → Pages**.
4. Under the build and deployment settings, select **Deploy from a branch**.
5. Select the main branch and the root directory.
6. Save the settings and wait for deployment to complete.
7. Open the published website using the URL provided by GitHub Pages.

Ensure that all file references use appropriate relative paths so that the application works correctly after deployment.

## Data Storage and Limitations

The application uses browser localStorage to save records and preferences.

- Data persists in the same browser until it is cleared.
- Data is not automatically synchronized across different devices or users.
- Clearing browser storage may permanently remove saved records.
- Authentication is implemented on the client side for demonstration purposes.

This version is intended for academic demonstration and should not be used to store sensitive personal information.

## Project Objectives

1. Simplify volunteer management and coordination.
2. Organize educational guidance and mentoring sessions.
3. Improve the planning of events and student-support activities.
4. Track tasks, responsibilities, and programme progress.
5. Provide an accessible interface for managing and reviewing records.
6. Apply software engineering principles to the design and development of a web application.

## Future Enhancements

- Secure backend authentication and authorization.
- Shared data storage across users and devices.
- Database integration.
- Automated notifications and reminders.
- Calendar integration.
- Enhanced reporting and analytics.

These enhancements would require additional infrastructure beyond the current frontend-only implementation.

## Security Disclaimer

DawnBloom is an academic project. Client-side authentication and localStorage do not provide production-level security. A real-world deployment would require secure server-side authentication, access controls, and appropriate data protection.

## Project Information

- **Project Name:** DawnBloom
- **Project Type:** Software Engineering
- **Application:** Volunteer and Student Guidance Management System
- **Technologies:** HTML, CSS, JavaScript
- **Storage:** Browser localStorage
- **Deployment:** GitHub Pages

## Mission

DawnBloom aims to make volunteer coordination easier and support educational opportunities for children through guidance, mentoring, and community involvement.

*Developed as a Software Engineering college project.*
