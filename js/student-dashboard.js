/**
 * DAWNBLOOM — Student Dashboard Controller
 * Manages student-specific data views:
 * - Assigned Volunteer Mentor profile
 * - Upcoming guidance sessions for this student
 * - Community events & developmental activities
 * - Assigned learning tasks with real-time status toggles
 * - Learning progress tracking & milestones
 * - Detailed student profile
 */

(function (window) {
  'use strict';

  const STORAGE = window.DawnBloomStorage;
  const KEYS = STORAGE.KEYS;

  let currentUser = null;
  let activeStudent = null;
  let activeMentor = null;

  function init() {
    currentUser = window.DawnBloomAuth.getCurrentUser();
    if (!currentUser) {
      window.location.replace('login.html?redirect=student-dashboard.html');
      return;
    }

    // Strict access control: Volunteers and Admins CANNOT access the student dashboard!
    // Only logged-in Students can access student-dashboard.html.
    if (currentUser.role !== 'Student') {
      window.location.replace('dashboard.html');
      return;
    }

    const allStudents = STORAGE.getCollection(KEYS.STUDENTS);
    const stuId = currentUser.studentId || currentUser.id;
    activeStudent = allStudents.find(s => 
      (s.id && s.id.toUpperCase() === stuId.toUpperCase()) ||
      (s.name && s.name.toLowerCase() === currentUser.name.toLowerCase())
    );

    // Fallback if no student profile found
    if (!activeStudent) {
      activeStudent = {
        id: currentUser.studentId || 'STU-101',
        name: currentUser.name || 'Demo Student',
        classLevel: 'Grade 6',
        ageGroup: '10–12 Years',
        subjects: 'Mathematics, Science',
        guidanceNeeds: 'General educational mentorship and study support.',
        assignedVolunteerId: 'VOL-001',
        assignedVolunteerName: 'Sarah Jenkins',
        enrollmentDate: new Date().toISOString().split('T')[0],
        status: 'Active'
      };
    }

    // Load assigned mentor details
    loadMentorDetails();

    // Render all dashboard sections
    renderHeaderAndWelcome();
    renderSummaryMetrics();
    renderMentorSection();
    renderUpcomingSessions();
    renderEventsAndActivities();
    renderAssignedTasks();
    renderProgressAndMilestones();
    renderProfileSection();

    // Setup interactive modal events
    setupModals();
  }

  function loadMentorDetails() {
    const volunteers = STORAGE.getCollection(KEYS.VOLUNTEERS);
    if (activeStudent.assignedVolunteerId) {
      activeMentor = volunteers.find(v => v.id === activeStudent.assignedVolunteerId);
    }
    if (!activeMentor && activeStudent.assignedVolunteerName) {
      activeMentor = volunteers.find(v => v.name.toLowerCase() === activeStudent.assignedVolunteerName.toLowerCase());
    }
    if (!activeMentor) {
      // Default to first active volunteer
      activeMentor = volunteers.find(v => v.status === 'Active') || {
        id: 'VOL-001',
        name: 'Sarah Jenkins',
        email: 'sarah.jenkins@example.org',
        phone: '+1 (555) 234-8901',
        skills: 'Mathematics, Science, Public Speaking',
        interest: 'STEM Mentorship & Tutoring',
        availability: 'Weekends (Morning)'
      };
    }
  }

  function renderHeaderAndWelcome() {
    const studentName = activeStudent.name || 'Student';
    const firstName = studentName.split(' ')[0];

    const welcomeGreeting = document.getElementById('studentWelcomeGreeting');
    if (welcomeGreeting) {
      const hour = new Date().getHours();
      let timeOfDay = 'Good day';
      if (hour < 12) timeOfDay = 'Good morning';
      else if (hour < 18) timeOfDay = 'Good afternoon';
      else timeOfDay = 'Good evening';

      welcomeGreeting.textContent = `${timeOfDay}, ${firstName}! 🌟`;
    }

    const bannerSubtitle = document.getElementById('studentBannerSubtitle');
    if (bannerSubtitle) {
      bannerSubtitle.textContent = `Student ID: ${activeStudent.id} • ${activeStudent.classLevel || 'General'} • Mentor: ${activeMentor ? activeMentor.name : 'Assigned Tutor'}`;
    }

    // Topbar & Sidebar identity
    const sidebarAvatar = document.getElementById('sidebarUserAvatar');
    const sidebarName = document.getElementById('sidebarUserName');
    const sidebarRole = document.getElementById('sidebarUserRole');

    const initials = studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST';

    if (sidebarAvatar) sidebarAvatar.textContent = initials;
    if (sidebarName) sidebarName.textContent = studentName;
    if (sidebarRole) sidebarRole.textContent = `Student (${activeStudent.id})`;

    const topbarAvatar = document.getElementById('topbarStudentInitials');
    if (topbarAvatar) topbarAvatar.textContent = initials;
    const topbarName = document.getElementById('topbarStudentName');
    if (topbarName) topbarName.textContent = studentName;
  }

  function renderSummaryMetrics() {
    const guidance = STORAGE.getCollection(KEYS.GUIDANCE);
    const tasks = STORAGE.getCollection(KEYS.TASKS);

    // Sessions for this student
    const studentSessions = guidance.filter(g => 
      (g.studentId && g.studentId.toUpperCase() === activeStudent.id.toUpperCase()) ||
      (g.studentName && g.studentName.toLowerCase() === activeStudent.name.toLowerCase())
    );

    const upcomingSessions = studentSessions.filter(g => g.status === 'Scheduled');
    const completedSessions = studentSessions.filter(g => g.status === 'Completed');

    // Tasks for this student
    const studentTasks = tasks.filter(t => 
      (t.assignedStudentId && t.assignedStudentId.toUpperCase() === activeStudent.id.toUpperCase()) ||
      (t.studentName && t.studentName.toLowerCase() === activeStudent.name.toLowerCase()) ||
      (t.assignedVolunteerId && activeMentor && t.assignedVolunteerId === activeMentor.id && !t.assignedStudentId)
    );

    const activeTasks = studentTasks.filter(t => t.status !== 'Completed');
    const completedTasks = studentTasks.filter(t => t.status === 'Completed');

    // Calculate progress
    const totalGoals = studentSessions.length + studentTasks.length;
    const completedGoals = completedSessions.length + completedTasks.length;
    const progressPercent = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 80;

    // Render Stats
    const mentorNameEl = document.getElementById('statMentorName');
    const mentorSkillsEl = document.getElementById('statMentorSkills');
    if (mentorNameEl) mentorNameEl.textContent = activeMentor ? activeMentor.name : 'Sarah Jenkins';
    if (mentorSkillsEl) mentorSkillsEl.textContent = activeMentor ? (activeMentor.skills.split(',')[0] + ' Mentorship') : 'STEM Tutoring';

    const upcomingCountEl = document.getElementById('statUpcomingSessionsCount');
    const upcomingDescEl = document.getElementById('statUpcomingSessionsDesc');
    if (upcomingCountEl) upcomingCountEl.textContent = upcomingSessions.length;
    if (upcomingDescEl) {
      if (upcomingSessions.length > 0) {
        const next = upcomingSessions[0];
        upcomingDescEl.textContent = `Next: ${window.DawnBloom.formatDate(next.date)} (${window.DawnBloom.formatTime(next.startTime)})`;
      } else {
        upcomingDescEl.textContent = 'No upcoming sessions scheduled';
      }
    }

    const tasksCountEl = document.getElementById('statActiveTasksCount');
    const tasksDescEl = document.getElementById('statActiveTasksDesc');
    if (tasksCountEl) tasksCountEl.textContent = activeTasks.length;
    if (tasksDescEl) tasksDescEl.textContent = `${completedTasks.length} task${completedTasks.length === 1 ? '' : 's'} completed`;

    const progressPercentEl = document.getElementById('statProgressPercent');
    const progressDescEl = document.getElementById('statProgressDesc');
    if (progressPercentEl) progressPercentEl.textContent = `${progressPercent}%`;
    if (progressDescEl) progressDescEl.textContent = `${completedGoals} of ${totalGoals || 1} milestones reached`;
  }

  function renderMentorSection() {
    const container = document.getElementById('mentorCardContainer');
    if (!container) return;

    if (!activeMentor) {
      container.innerHTML = `<p style="color: var(--text-muted);">No mentor currently assigned. Please contact the administrator.</p>`;
      return;
    }

    const mentorInitials = activeMentor.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    container.innerHTML = `
      <div class="student-mentor-card">
        <div class="student-mentor-avatar">${mentorInitials}</div>
        <div class="student-mentor-details">
          <div class="student-mentor-name">${STORAGE.escapeHtml(activeMentor.name)}</div>
          <div class="student-mentor-role">Assigned Volunteer Mentor • ${STORAGE.escapeHtml(activeMentor.interest || 'Academic Guidance')}</div>
          
          <div class="student-mentor-meta">
            <div class="student-mentor-meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <span>${STORAGE.escapeHtml(activeMentor.email)}</span>
            </div>
            <div class="student-mentor-meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              <span>${STORAGE.escapeHtml(activeMentor.phone || 'Available via Study Hall')}</span>
            </div>
            <div class="student-mentor-meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>Availability: ${STORAGE.escapeHtml(activeMentor.availability || 'Weekends')}</span>
            </div>
            <div class="student-mentor-meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <span>Subject Expertise: ${STORAGE.escapeHtml(activeMentor.skills)}</span>
            </div>
          </div>

          <div style="background: rgba(27, 30, 43, 0.6); border-radius: var(--radius-sm); padding: 10px 14px; margin-bottom: var(--space-md); font-size: 0.85rem; color: var(--text-secondary); border-left: 3px solid var(--c-dusty-rose);">
            <strong style="color: #fff;">Mentor Note:</strong> “${STORAGE.escapeHtml(activeMentor.notes || activeStudent.guidanceNeeds || 'Looking forward to our upcoming learning session!')}”
          </div>

          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button type="button" class="btn btn-primary btn-sm" id="btnOpenMentorNoteModal">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              Send Note to Mentor
            </button>
            <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('sectionGuidanceSessions').scrollIntoView({ behavior: 'smooth' });">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              View Guidance Schedule
            </button>
          </div>
        </div>
      </div>
    `;

    const noteBtn = document.getElementById('btnOpenMentorNoteModal');
    if (noteBtn) {
      noteBtn.addEventListener('click', openMentorNoteModal);
    }
  }

  function renderUpcomingSessions() {
    const container = document.getElementById('upcomingSessionsContainer');
    if (!container) return;

    const guidance = STORAGE.getCollection(KEYS.GUIDANCE);
    const mySessions = guidance.filter(g => 
      ((g.studentId && g.studentId.toUpperCase() === activeStudent.id.toUpperCase()) ||
      (g.studentName && g.studentName.toLowerCase() === activeStudent.name.toLowerCase())) &&
      g.status === 'Scheduled'
    );

    if (mySessions.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 24px;">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <h3 class="empty-state-title" style="font-size: 1rem;">No Upcoming Guidance Sessions</h3>
          <p class="empty-state-desc" style="font-size: 0.84rem;">You are all caught up! Your mentor will schedule your next tutoring session soon.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = mySessions.map(sess => {
      const dateBadge = (window.DawnBloom && window.DawnBloom.parseDateBadge) 
        ? window.DawnBloom.parseDateBadge(sess.date) 
        : { month: 'DATE', day: '--' };

      return `
      <div style="background: rgba(75, 61, 79, 0.22); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <div style="display: flex; gap: 14px; align-items: center;">
          <div style="min-width: 54px; text-align: center; background: rgba(178, 108, 134, 0.3); border: 1px solid rgba(226, 194, 210, 0.25); border-radius: var(--radius-sm); padding: 6px 8px;">
            <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--c-blush-pink); font-weight: 700;">
              ${dateBadge.month}
            </div>
            <div style="font-size: 1.35rem; font-weight: 700; color: #fff; line-height: 1;">
              ${dateBadge.day}
            </div>
          </div>
          <div>
            <div style="font-size: 1rem; font-weight: 600; color: #fff;">${STORAGE.escapeHtml(sess.title)}</div>
            <div style="font-size: 0.82rem; color: var(--text-muted); display: flex; gap: 10px; align-items: center; margin-top: 4px; flex-wrap: wrap;">
              <span style="color: var(--c-blush-pink); font-weight: 500;">${STORAGE.escapeHtml(sess.subject)}</span>
              <span>•</span>
              <span>⏰ ${window.DawnBloom.formatTime(sess.startTime)} – ${window.DawnBloom.formatTime(sess.endTime)}</span>
              <span>•</span>
              <span>📍 ${STORAGE.escapeHtml(sess.venue || 'Study Hall')}</span>
            </div>
            <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 4px;">
              Mentor: <strong>${STORAGE.escapeHtml(sess.volunteerName)}</strong>
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="badge badge-scheduled">Scheduled</span>
          <button type="button" class="btn btn-outline btn-sm" onclick="window.DawnBloomStudent.showSessionDetails('${sess.id}')">
            Session Details
          </button>
        </div>
      </div>
    `;
    }).join('');
  }

  function renderEventsAndActivities() {
    const container = document.getElementById('studentEventsContainer');
    if (!container) return;

    const events = STORAGE.getCollection(KEYS.EVENTS);
    const activities = STORAGE.getCollection(KEYS.ACTIVITIES);

    const scheduledEvents = events.filter(e => e.status !== 'Cancelled').slice(0, 3);
    const activeActivities = activities.filter(a => a.status !== 'Cancelled').slice(0, 3);

    if (scheduledEvents.length === 0 && activeActivities.length === 0) {
      container.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 20px;">No events or activities scheduled at this time.</p>`;
      return;
    }

    let html = '';

    // Render Events with complete details
    scheduledEvents.forEach(evt => {
      const volNames = evt.assignedVolunteerNames || 'Sarah Jenkins, Priya Nair';
      html += `
        <div style="background: rgba(22, 25, 36, 0.8); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="flex: 1; min-width: 240px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span class="badge badge-scheduled" style="font-size: 0.72rem; padding: 2px 8px;">Event • ${STORAGE.escapeHtml(evt.category || 'Workshop')}</span>
              <span style="font-size: 0.82rem; color: var(--c-blush-pink);">📅 ${window.DawnBloom.formatDate(evt.date)}</span>
            </div>
            <div style="font-weight: 600; color: #fff; font-size: 0.96rem;">${STORAGE.escapeHtml(evt.name)}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 3px;">
              📍 ${STORAGE.escapeHtml(evt.location || 'Main Hall')} • ⏰ ${window.DawnBloom.formatTime(evt.startTime)} – ${window.DawnBloom.formatTime(evt.endTime)} • 👤 Mentors: ${STORAGE.escapeHtml(volNames)}
            </div>
            <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px; line-height: 1.35;">
              ${STORAGE.escapeHtml(evt.description || 'Open developmental session for students.')}
            </div>
          </div>

          <div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.DawnBloomStudent.toggleEventRSVP('${evt.id}', this)">
              <span>I'm Interested / Attending</span>
            </button>
          </div>
        </div>
      `;
    });

    // Render Activities with complete details
    activeActivities.forEach(act => {
      html += `
        <div style="background: rgba(75, 61, 79, 0.22); border: 1px solid rgba(226, 194, 210, 0.2); border-radius: var(--radius-md); padding: 14px 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="flex: 1; min-width: 240px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span class="badge badge-ongoing" style="font-size: 0.72rem; padding: 2px 8px;">Programme • ${STORAGE.escapeHtml(act.category || 'Activity')}</span>
              <span style="font-size: 0.82rem; color: var(--c-blush-pink);">📅 ${window.DawnBloom.formatDate(act.date)} (${STORAGE.escapeHtml(act.duration || 'Weekly')})</span>
            </div>
            <div style="font-weight: 600; color: #fff; font-size: 0.96rem;">${STORAGE.escapeHtml(act.name)}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 3px;">
              🎯 Target: ${STORAGE.escapeHtml(act.targetGroup || 'Students')} • 👥 Mentors: ${STORAGE.escapeHtml(act.volunteersInvolved || 'Marcus Vance, Elena Rostova')}
            </div>
            <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px; line-height: 1.35;">
              ${STORAGE.escapeHtml(act.description || 'Structured developmental learning activity.')}
            </div>
          </div>

          <div>
            <button type="button" class="btn btn-outline btn-sm" onclick="window.DawnBloom.showToast('You are registered for ' + '${STORAGE.escapeHtml(act.name)}', 'success')">
              <span>View Programme</span>
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function renderAssignedTasks() {
    const container = document.getElementById('studentTaskList');
    if (!container) return;

    const tasks = STORAGE.getCollection(KEYS.TASKS);
    
    // Filter tasks strictly assigned to this student (do not show internal staff tasks)
    const studentTasks = tasks.filter(t => 
      (t.assignedStudentId && t.assignedStudentId.toUpperCase() === activeStudent.id.toUpperCase()) ||
      (t.studentName && t.studentName.toLowerCase().includes(activeStudent.name.toLowerCase().split(' ')[0]))
    );

    if (studentTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 20px;">
          <p class="empty-state-title" style="font-size: 0.95rem;">No Pending Tasks</p>
          <p class="empty-state-desc" style="font-size: 0.82rem;">Great job! You have completed all learning tasks assigned by your mentor.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = studentTasks.map(task => {
      const isDone = task.status === 'Completed';
      let priorityClass = 'badge-in-progress';
      if (task.priority === 'High') priorityClass = 'badge-scheduled';
      else if (task.priority === 'Low') priorityClass = 'badge-active';

      return `
        <div class="student-task-item ${isDone ? 'is-completed' : ''}" id="taskItem-${task.id}">
          <div class="student-task-info">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span class="badge ${priorityClass}" style="font-size: 0.7rem; padding: 2px 6px;">${STORAGE.escapeHtml(task.priority || 'Normal')} Priority</span>
              <span class="badge ${isDone ? 'badge-completed' : 'badge-in-progress'}" style="font-size: 0.7rem; padding: 2px 6px;">${STORAGE.escapeHtml(task.status)}</span>
            </div>
            <div class="student-task-title">${STORAGE.escapeHtml(task.title)}</div>
            <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 4px;">${STORAGE.escapeHtml(task.description || 'Complete guided practice.')}</div>
            <div class="student-task-meta">
              <span>📅 Due: <strong>${window.DawnBloom.formatDate(task.dueDate)}</strong></span>
              <span>•</span>
              <span>Mentor: <strong>${STORAGE.escapeHtml(task.assignedVolunteerName || (activeMentor ? activeMentor.name : 'Tutor'))}</strong></span>
              <span>•</span>
              <span>Student: <strong>${STORAGE.escapeHtml(activeStudent.name)}</strong></span>
            </div>
          </div>

          <div class="student-task-actions">
            ${isDone ? `
              <button type="button" class="btn btn-outline btn-sm" onclick="window.DawnBloomStudent.toggleTaskCompletion('${task.id}', 'In Progress')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"></path><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                Reopen Task
              </button>
            ` : `
              <button type="button" class="btn btn-primary btn-sm" onclick="window.DawnBloomStudent.toggleTaskCompletion('${task.id}', 'Completed')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Mark as Completed
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  function renderProgressAndMilestones() {
    const guidance = STORAGE.getCollection(KEYS.GUIDANCE);
    const tasks = STORAGE.getCollection(KEYS.TASKS);

    const studentSessions = guidance.filter(g => 
      (g.studentId && g.studentId.toUpperCase() === activeStudent.id.toUpperCase()) ||
      (g.studentName && g.studentName.toLowerCase() === activeStudent.name.toLowerCase())
    );

    const completedSessions = studentSessions.filter(g => g.status === 'Completed');

    const studentTasks = tasks.filter(t => 
      (t.assignedStudentId && t.assignedStudentId.toUpperCase() === activeStudent.id.toUpperCase()) ||
      (t.studentName && t.studentName.toLowerCase() === activeStudent.name.toLowerCase())
    );

    const completedTasks = studentTasks.filter(t => t.status === 'Completed');

    // Progress bar
    const totalItems = (studentSessions.length || 2) + (studentTasks.length || 3);
    const doneItems = completedSessions.length + completedTasks.length;
    const rate = Math.round((doneItems / totalItems) * 100);

    const progressFill = document.getElementById('studentProgressBarFill');
    const progressLabel = document.getElementById('studentProgressPercentLabel');
    const progressDetails = document.getElementById('studentProgressRatioLabel');

    if (progressFill) progressFill.style.width = `${rate}%`;
    if (progressLabel) progressLabel.textContent = `${rate}% Completed`;
    if (progressDetails) progressDetails.textContent = `${completedSessions.length} guidance sessions completed • ${completedTasks.length} tasks finished`;

    // Completed sessions history log
    const historyContainer = document.getElementById('completedSessionsHistory');
    if (historyContainer) {
      if (completedSessions.length === 0) {
        historyContainer.innerHTML = `<p style="font-size: 0.84rem; color: var(--text-muted); text-align: center; padding: 12px;">Completed guidance sessions will be archived here.</p>`;
      } else {
        historyContainer.innerHTML = completedSessions.map(cs => `
          <div style="display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(134, 128, 146, 0.15);">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--state-success-bg); color: var(--state-success); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.85rem; font-weight: bold;">✓</div>
            <div>
              <div style="font-weight: 600; font-size: 0.9rem; color: #fff;">${STORAGE.escapeHtml(cs.title)}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">
                ${window.DawnBloom.formatDate(cs.date)} • Subject: ${STORAGE.escapeHtml(cs.subject)} • Mentor: ${STORAGE.escapeHtml(cs.volunteerName)}
              </div>
              <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 3px; font-style: italic;">
                "${STORAGE.escapeHtml(cs.notes || 'Demonstrated good engagement.')}"
              </div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  function renderProfileSection() {
    const profileGrid = document.getElementById('studentProfileDetailsGrid');
    if (!profileGrid) return;

    profileGrid.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 4px; padding: 12px; background: rgba(75, 61, 79, 0.2); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <span style="font-size: 0.74rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Student ID</span>
        <span style="font-size: 1rem; font-weight: 700; color: var(--c-blush-pink);">${STORAGE.escapeHtml(activeStudent.id)}</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 4px; padding: 12px; background: rgba(75, 61, 79, 0.2); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <span style="font-size: 0.74rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Full Name</span>
        <span style="font-size: 1rem; font-weight: 600; color: #fff;">${STORAGE.escapeHtml(activeStudent.name)}</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 4px; padding: 12px; background: rgba(75, 61, 79, 0.2); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <span style="font-size: 0.74rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Class / Level</span>
        <span style="font-size: 0.95rem; color: #fff;">${STORAGE.escapeHtml(activeStudent.classLevel || 'Grade 6')}</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 4px; padding: 12px; background: rgba(75, 61, 79, 0.2); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <span style="font-size: 0.74rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Age Bracket</span>
        <span style="font-size: 0.95rem; color: #fff;">${STORAGE.escapeHtml(activeStudent.ageGroup || '10–12 Years')}</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 4px; padding: 12px; background: rgba(75, 61, 79, 0.2); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <span style="font-size: 0.74rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Guidance Subjects</span>
        <span style="font-size: 0.95rem; color: #fff;">${STORAGE.escapeHtml(activeStudent.subjects || 'General')}</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 4px; padding: 12px; background: rgba(75, 61, 79, 0.2); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <span style="font-size: 0.74rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Assigned Mentor</span>
        <span style="font-size: 0.95rem; color: var(--c-blush-pink); font-weight: 600;">${STORAGE.escapeHtml(activeMentor ? activeMentor.name : 'Unassigned')}</span>
      </div>

      <div style="grid-column: 1 / -1; display: flex; flex-direction: column; gap: 4px; padding: 12px; background: rgba(75, 61, 79, 0.2); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <span style="font-size: 0.74rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Learning Goals & Focus Areas</span>
        <span style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.4;">${STORAGE.escapeHtml(activeStudent.guidanceNeeds || 'Focus on foundational problem solving and confidence building.')}</span>
      </div>
    `;
  }

  function setupModals() {
    // 1. Mentor Note Modal
    const mentorModal = document.getElementById('modalMentorNote');
    const closeNoteBtn = document.getElementById('btnCloseMentorNote');
    const cancelNoteBtn = document.getElementById('btnCancelMentorNote');
    const noteForm = document.getElementById('formMentorNote');

    if (closeNoteBtn && mentorModal) {
      closeNoteBtn.addEventListener('click', () => mentorModal.classList.remove('open'));
    }
    if (cancelNoteBtn && mentorModal) {
      cancelNoteBtn.addEventListener('click', () => mentorModal.classList.remove('open'));
    }
    if (noteForm) {
      noteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const noteText = document.getElementById('mentorNoteMessage').value.trim();
        if (!noteText) {
          window.DawnBloom.showToast('Please type your question or note first.', 'error');
          return;
        }

        STORAGE.logActivity('Student Note', `Note sent from ${activeStudent.name} to ${activeMentor ? activeMentor.name : 'Mentor'}: "${noteText.substring(0, 40)}..."`, activeStudent.id);
        mentorModal.classList.remove('open');
        document.getElementById('mentorNoteMessage').value = '';
        window.DawnBloom.showToast('Your note has been delivered to your mentor!', 'success');
      });
    }

    // 2. Session Detail Modal
    const sessionModal = document.getElementById('modalSessionDetail');
    const closeSessionBtn = document.getElementById('btnCloseSessionDetail');
    const okSessionBtn = document.getElementById('btnOkSessionDetail');

    if (closeSessionBtn && sessionModal) {
      closeSessionBtn.addEventListener('click', () => sessionModal.classList.remove('open'));
    }
    if (okSessionBtn && sessionModal) {
      okSessionBtn.addEventListener('click', () => sessionModal.classList.remove('open'));
    }

    // 3. Edit Learning Preferences Modal
    const prefModal = document.getElementById('modalEditPreferences');
    const openPrefBtn = document.getElementById('btnOpenEditPreferences');
    const closePrefBtn = document.getElementById('btnCloseEditPreferences');
    const cancelPrefBtn = document.getElementById('btnCancelEditPreferences');
    const prefForm = document.getElementById('formEditPreferences');

    if (openPrefBtn && prefModal) {
      openPrefBtn.addEventListener('click', () => {
        document.getElementById('prefInputSubjects').value = activeStudent.subjects || '';
        document.getElementById('prefInputGoals').value = activeStudent.guidanceNeeds || '';
        prefModal.classList.add('open');
      });
    }

    if (closePrefBtn && prefModal) {
      closePrefBtn.addEventListener('click', () => prefModal.classList.remove('open'));
    }
    if (cancelPrefBtn && prefModal) {
      cancelPrefBtn.addEventListener('click', () => prefModal.classList.remove('open'));
    }

    if (prefForm) {
      prefForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newSubjects = document.getElementById('prefInputSubjects').value.trim();
        const newGoals = document.getElementById('prefInputGoals').value.trim();

        STORAGE.updateItem(KEYS.STUDENTS, activeStudent.id, {
          subjects: newSubjects,
          guidanceNeeds: newGoals
        });

        activeStudent.subjects = newSubjects;
        activeStudent.guidanceNeeds = newGoals;

        renderProfileSection();
        prefModal.classList.remove('open');
        window.DawnBloom.showToast('Your learning preferences have been updated!', 'success');
      });
    }
  }

  function openMentorNoteModal() {
    const modal = document.getElementById('modalMentorNote');
    if (modal) {
      const recipientSpan = document.getElementById('mentorNoteRecipientName');
      if (recipientSpan && activeMentor) {
        recipientSpan.textContent = activeMentor.name;
      }
      modal.classList.add('open');
      document.getElementById('mentorNoteMessage').focus();
    }
  }

  function showSessionDetails(sessionId) {
    const guidance = STORAGE.getCollection(KEYS.GUIDANCE);
    const session = guidance.find(g => g.id === sessionId);
    if (!session) return;

    const modal = document.getElementById('modalSessionDetail');
    const titleEl = document.getElementById('sessionDetailTitle');
    const contentEl = document.getElementById('sessionDetailContent');

    if (titleEl) titleEl.textContent = session.title;
    if (contentEl) {
      contentEl.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; gap: 10px; align-items: center;">
            <span class="badge badge-scheduled">${STORAGE.escapeHtml(session.status)}</span>
            <span style="font-weight: 600; color: var(--c-blush-pink);">${STORAGE.escapeHtml(session.subject)}</span>
          </div>

          <div style="background: rgba(75, 61, 79, 0.2); border-radius: var(--radius-sm); padding: 12px; font-size: 0.88rem; color: var(--text-secondary);">
            <div>📅 <strong>Date:</strong> ${window.DawnBloom.formatDate(session.date)}</div>
            <div>⏰ <strong>Time:</strong> ${window.DawnBloom.formatTime(session.startTime)} – ${window.DawnBloom.formatTime(session.endTime)}</div>
            <div>📍 <strong>Venue:</strong> ${STORAGE.escapeHtml(session.venue || 'Study Hall')}</div>
            <div>👤 <strong>Mentor:</strong> ${STORAGE.escapeHtml(session.volunteerName)}</div>
          </div>

          <div>
            <div style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600; margin-bottom: 4px;">Preparation & Objectives:</div>
            <p style="font-size: 0.9rem; color: #fff; line-height: 1.4; background: rgba(22, 25, 36, 0.8); padding: 12px; border-radius: var(--radius-sm); border-left: 3px solid var(--c-blush-pink);">
              ${STORAGE.escapeHtml(session.notes || 'Please bring your workbook and study materials to the session.')}
            </p>
          </div>
        </div>
      `;
    }

    if (modal) modal.classList.add('open');
  }

  function toggleTaskCompletion(taskId, newStatus) {
    const tasks = STORAGE.getCollection(KEYS.TASKS);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    STORAGE.updateItem(KEYS.TASKS, taskId, { status: newStatus });
    STORAGE.logActivity('Task Progress', `Student ${activeStudent.name} updated task "${task.title}" to ${newStatus}`, taskId);

    if (newStatus === 'Completed') {
      window.DawnBloom.showToast(`Great work! Task marked as completed! 🎉`, 'success');
    } else {
      window.DawnBloom.showToast(`Task moved back to in progress.`, 'info');
    }

    renderSummaryMetrics();
    renderAssignedTasks();
    renderProgressAndMilestones();
  }

  function toggleEventRSVP(eventId, btnEl) {
    const events = STORAGE.getCollection(KEYS.EVENTS);
    const evt = events.find(e => e.id === eventId);
    if (!evt) return;

    btnEl.classList.toggle('btn-primary');
    btnEl.classList.toggle('btn-secondary');

    const isAttending = btnEl.classList.contains('btn-primary');
    if (isAttending) {
      btnEl.innerHTML = `<span>✓ Registered / Attending</span>`;
      window.DawnBloom.showToast(`You have expressed interest in "${evt.name}"! Your mentor will be notified.`, 'success');
      STORAGE.logActivity('Event RSVP', `Student ${activeStudent.name} registered interest for event ${evt.name}`, eventId);
    } else {
      btnEl.innerHTML = `<span>I'm Interested / Attending</span>`;
      window.DawnBloom.showToast(`RSVP updated for "${evt.name}".`, 'info');
    }
  }

  // Initialize on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose methods for button handlers
  window.DawnBloomStudent = {
    showSessionDetails,
    toggleTaskCompletion,
    toggleEventRSVP
  };

})(window);
