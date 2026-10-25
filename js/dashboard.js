/**
 * DAWNBLOOM — Dashboard Controller
 * Calculates live metrics from localStorage collections,
 * renders upcoming events, recent activities, task status breakdown,
 * and handles quick-action modals or links.
 */

(function (window) {
  'use strict';

  const STORAGE = window.DawnBloomStorage;
  const KEYS = STORAGE.KEYS;

  function loadDashboardData() {
    const volunteers = STORAGE.getCollection(KEYS.VOLUNTEERS);
    const students = STORAGE.getCollection(KEYS.STUDENTS);
    const guidance = STORAGE.getCollection(KEYS.GUIDANCE);
    const events = STORAGE.getCollection(KEYS.EVENTS);
    const tasks = STORAGE.getCollection(KEYS.TASKS);
    const logs = STORAGE.getCollection(KEYS.ACTIVITY_LOG);
    const prefs = STORAGE.getCollection(KEYS.PREFERENCES) || {};

    // 1. Metric calculations
    const currentUser = window.DawnBloomAuth.getCurrentUser();
    const isVolunteer = currentUser && currentUser.role === 'Volunteer';
    const volId = isVolunteer ? (currentUser.volunteerId || (volunteers.find(v => v.email && currentUser.email && v.email.toLowerCase() === currentUser.email.toLowerCase()) || {}).id) : null;

    const totalVolunteers = volunteers.length;
    const activeVolunteers = volunteers.filter(v => v.status === 'Active').length;

    const myStudents = isVolunteer ? students.filter(s => (volId && s.assignedVolunteerId === volId) || (s.assignedVolunteerName && s.assignedVolunteerName.toLowerCase().includes(currentUser.name.toLowerCase()))) : students;
    const totalStudents = isVolunteer ? myStudents.length : students.length;
    const activeStudents = isVolunteer ? myStudents.filter(s => s.status === 'Active').length : students.filter(s => s.status === 'Active').length;

    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingEvents = events.filter(e => e.status === 'Scheduled' || (e.status !== 'Cancelled' && e.date >= todayStr));

    const myTasks = isVolunteer ? tasks.filter(t => (volId && t.assignedVolunteerId === volId) || (t.assignedVolunteerName && t.assignedVolunteerName.toLowerCase().includes(currentUser.name.toLowerCase()))) : tasks;
    const pendingTasks = myTasks.filter(t => t.status !== 'Completed');
    const completedTasks = myTasks.filter(t => t.status === 'Completed');

    const myGuidance = isVolunteer ? guidance.filter(g => (volId && g.volunteerId === volId) || (g.volunteerName && g.volunteerName.toLowerCase().includes(currentUser.name.toLowerCase()))) : guidance;
    const scheduledGuidance = myGuidance.filter(g => g.status === 'Scheduled');

    // 2. Render Metric Cards
    document.getElementById('statTotalVolunteers').textContent = totalVolunteers;
    document.getElementById('statActiveVolunteers').textContent = `${activeVolunteers} active members`;

    document.getElementById('statTotalStudents').textContent = totalStudents;
    document.getElementById('statActiveStudents').textContent = isVolunteer ? `${activeStudents} assigned mentees` : `${activeStudents} receiving guidance`;

    document.getElementById('statUpcomingEvents').textContent = upcomingEvents.length;
    document.getElementById('statScheduledGuidance').textContent = scheduledGuidance.length;
    document.getElementById('statPendingTasks').textContent = pendingTasks.length;

    // 3. User Greeting in Welcome Banner
    const greetingEl = document.getElementById('welcomeGreeting');
    if (greetingEl && currentUser) {
      const greetingName = currentUser.name.split(' ')[0];
      const hour = new Date().getHours();
      let timeGreeting = 'Good day';
      if (hour < 12) timeGreeting = 'Good morning';
      else if (hour < 18) timeGreeting = 'Good afternoon';
      else timeGreeting = 'Good evening';

      greetingEl.textContent = isVolunteer ? `${timeGreeting}, ${greetingName}! (Volunteer Mentor)` : `${timeGreeting}, ${greetingName}!`;
    }

    // 4. Render Upcoming Events Widget
    renderUpcomingEvents(upcomingEvents);

    // 5. Render Recent Activities Feed
    renderActivityFeed(logs);

    // 6. Render Task Completion Progress & Breakdown
    renderTaskBreakdown(tasks);

    // 7. Render Volunteer Participation Overview
    renderVolunteerParticipation(volunteers, guidance, events);
  }

  function renderUpcomingEvents(upcoming) {
    const container = document.getElementById('upcomingEventsList');
    if (!container) return;

    if (upcoming.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 24px 12px; margin: 0;">
          <p class="empty-state-title" style="font-size: 1rem;">No Upcoming Events</p>
          <p class="empty-state-desc" style="font-size: 0.82rem; margin-bottom: 12px;">Plan an educational workshop, literacy fair, or sports meet.</p>
          <a href="events.html" class="btn btn-outline btn-sm">Schedule an Event</a>
        </div>
      `;
      return;
    }

    // Sort by earliest date
    const sorted = [...upcoming].sort((a, b) => (a.date || '').localeCompare(b.date || '')).slice(0, 4);

    container.innerHTML = sorted.map(evt => {
      const badgeDate = (window.DawnBloom && window.DawnBloom.parseDateBadge) 
        ? window.DawnBloom.parseDateBadge(evt.date) 
        : { month: 'DATE', day: '--' };

      return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: rgba(75, 61, 79, 0.18); border: 1px solid rgba(226, 194, 210, 0.12); border-radius: var(--radius-md); margin-bottom: 8px;">
        <div style="display: flex; gap: 12px; align-items: center;">
          <div style="text-align: center; min-width: 48px; background: rgba(178, 108, 134, 0.25); border: 1px solid rgba(226, 194, 210, 0.2); border-radius: var(--radius-sm); padding: 4px 6px;">
            <div style="font-size: 0.68rem; text-transform: uppercase; color: var(--c-blush-pink); font-weight: 600;">
              ${badgeDate.month}
            </div>
            <div style="font-size: 1.15rem; font-weight: 700; color: #fff; line-height: 1;">
              ${badgeDate.day}
            </div>
          </div>
          <div>
            <div style="font-weight: 600; font-size: 0.92rem; color: #fff;">${STORAGE.escapeHtml(evt.name)}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); display: flex; gap: 8px; align-items: center; margin-top: 2px;">
              <span>${STORAGE.escapeHtml(evt.category)}</span>
              <span>•</span>
              <span>${window.DawnBloom.formatTime(evt.startTime)} - ${window.DawnBloom.formatTime(evt.endTime)}</span>
            </div>
          </div>
        </div>
        <span class="badge badge-scheduled">${STORAGE.escapeHtml(evt.status)}</span>
      </div>
    `}).join('');
  }

  function renderActivityFeed(logs) {
    const container = document.getElementById('recentActivityFeed');
    if (!container) return;

    const recent = logs.slice(0, 5);
    if (recent.length === 0) {
      container.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 16px;">No recent activities logged.</p>`;
      return;
    }

    container.innerHTML = recent.map(item => `
      <div style="display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(134, 128, 146, 0.12);">
        <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--c-blush-pink); margin-top: 6px; flex-shrink: 0;"></div>
        <div style="flex: 1;">
          <div style="font-size: 0.86rem; color: var(--text-primary);">
            <strong style="color: var(--c-blush-pink);">${STORAGE.escapeHtml(item.action)}</strong>: ${STORAGE.escapeHtml(item.details)}
          </div>
          <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">
            ${window.DawnBloom.formatDate(item.timestamp)} by ${STORAGE.escapeHtml(item.user)}
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderTaskBreakdown(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const todo = tasks.filter(t => t.status === 'To Do').length;

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const percentEl = document.getElementById('taskCompletionRate');
    const barEl = document.getElementById('taskProgressBar');
    const countEl = document.getElementById('taskCompletedRatio');

    if (percentEl) percentEl.textContent = `${percent}%`;
    if (barEl) barEl.style.width = `${percent}%`;
    if (countEl) countEl.textContent = `${completed} of ${total} tasks completed`;

    const todoEl = document.getElementById('taskCountTodo');
    const progEl = document.getElementById('taskCountProgress');
    const doneEl = document.getElementById('taskCountDone');

    if (todoEl) todoEl.textContent = todo;
    if (progEl) progEl.textContent = inProgress;
    if (doneEl) doneEl.textContent = completed;
  }

  function renderVolunteerParticipation(volunteers, guidance, events) {
    const container = document.getElementById('volunteerOverviewList');
    if (!container) return;

    if (volunteers.length === 0) {
      container.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 16px;">No volunteers registered yet.</p>`;
      return;
    }

    // Calculate participation for top 4 active volunteers
    const overviewData = volunteers.slice(0, 4).map(vol => {
      const guidanceCount = guidance.filter(g => g.volunteerId === vol.id).length;
      return {
        ...vol,
        guidanceCount
      };
    });

    container.innerHTML = overviewData.map(v => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(134, 128, 146, 0.1);">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(178, 108, 134, 0.3); border: 1px solid rgba(226, 194, 210, 0.2); display: flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 600; color: #fff;">
            ${v.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div style="font-size: 0.88rem; font-weight: 600; color: var(--text-primary);">${STORAGE.escapeHtml(v.name)}</div>
            <div style="font-size: 0.76rem; color: var(--text-muted);">${STORAGE.escapeHtml(v.interest || 'Mentorship')}</div>
          </div>
        </div>
        <div style="text-align: right;">
          <span class="badge ${v.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${v.status}</span>
          <div style="font-size: 0.72rem; color: var(--c-blush-pink); margin-top: 3px;">${v.guidanceCount} Sessions</div>
        </div>
      </div>
    `).join('');
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDashboardData);
  } else {
    loadDashboardData();
  }

})(window);
