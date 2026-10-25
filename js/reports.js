/**
 * DAWNBLOOM — Reports & Data Analytics Controller
 * Calculates live summaries, renders custom SVG and CSS charts without external dependencies,
 * and generates downloadable CSV files using browser Blob URLs with correct quoting and escaping.
 */

(function (window) {
  'use strict';

  const STORAGE = window.DawnBloomStorage;
  const KEYS = STORAGE.KEYS;

  function init() {
    loadReportsData();

    // Bind CSV Export Buttons
    bindExportButton('btnExportVolunteers', exportVolunteersCSV);
    bindExportButton('btnExportStudents', exportStudentsCSV);
    bindExportButton('btnExportGuidance', exportGuidanceCSV);
    bindExportButton('btnExportEvents', exportEventsCSV);
    bindExportButton('btnExportTasks', exportTasksCSV);
  }

  function bindExportButton(btnId, exportFunc) {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        exportFunc();
      });
    }
  }

  function loadReportsData() {
    const volunteers = STORAGE.getCollection(KEYS.VOLUNTEERS);
    const students = STORAGE.getCollection(KEYS.STUDENTS);
    const guidance = STORAGE.getCollection(KEYS.GUIDANCE);
    const events = STORAGE.getCollection(KEYS.EVENTS);
    const tasks = STORAGE.getCollection(KEYS.TASKS);
    const activities = STORAGE.getCollection(KEYS.ACTIVITIES);

    // Summary calculations
    const totalVolunteers = volunteers.length;
    const activeVolunteers = volunteers.filter(v => v.status === 'Active').length;
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.status === 'Active').length;
    const completedGuidance = guidance.filter(g => g.status === 'Completed').length;
    const scheduledGuidance = guidance.filter(g => g.status === 'Scheduled').length;
    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingEvents = events.filter(e => e.status !== 'Cancelled' && e.date >= todayStr).length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const completedActivities = activities.filter(a => a.status === 'Completed').length;

    // Render Stats
    setText('repTotalVolunteers', totalVolunteers);
    setText('repActiveVolunteers', `${activeVolunteers} active`);
    setText('repTotalStudents', totalStudents);
    setText('repActiveStudents', `${activeStudents} in active guidance`);
    setText('repCompletedGuidance', completedGuidance);
    setText('repUpcomingEvents', upcomingEvents);
    setText('repCompletedTasks', completedTasks);
    setText('repCompletedActivities', completedActivities);

    // Render SVG Charts
    renderGuidanceSubjectsChart(guidance);
    renderTaskStatusChart(tasks);
    renderVolunteerSkillsChart(volunteers);
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /**
   * Render SVG Bar Chart of Guidance Sessions by Subject
   */
  function renderGuidanceSubjectsChart(guidance) {
    const container = document.getElementById('chartGuidanceContainer');
    if (!container) return;

    if (guidance.length === 0) {
      container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 40px 0;">No guidance session data to visualize.</p>`;
      return;
    }

    // Count sessions per subject
    const subjectCounts = {};
    guidance.forEach(g => {
      const subj = g.subject ? g.subject.trim() : 'General';
      subjectCounts[subj] = (subjectCounts[subj] || 0) + 1;
    });

    const entries = Object.entries(subjectCounts);
    const maxVal = Math.max(...entries.map(e => e[1]), 1);

    const svgWidth = 560;
    const svgHeight = 220;
    const barWidth = Math.min(64, Math.floor((svgWidth - 60) / entries.length) - 16);
    const startX = 40;
    const chartBottom = svgHeight - 40;
    const chartHeight = chartBottom - 30;

    let barsSvg = '';
    entries.forEach(([label, count], index) => {
      const x = startX + index * (barWidth + 24);
      const barH = Math.round((count / maxVal) * chartHeight);
      const y = chartBottom - barH;

      barsSvg += `
        <g class="chart-bar-group">
          <!-- Subtle Glow Bar -->
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="6" fill="url(#gradBarPink)" />
          <!-- Count text on top -->
          <text x="${x + barWidth / 2}" y="${y - 8}" class="chart-value-label">${count}</text>
          <!-- Label below -->
          <text x="${x + barWidth / 2}" y="${chartBottom + 20}" class="chart-label">${STORAGE.escapeHtml(label.substring(0, 10))}</text>
        </g>
      `;
    });

    container.innerHTML = `
      <svg class="chart-svg" viewBox="0 0 ${svgWidth} ${svgHeight}">
        <defs>
          <linearGradient id="gradBarPink" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#E2C2D2" />
            <stop offset="100%" stop-color="#B26C86" />
          </linearGradient>
        </defs>
        <!-- Horizontal grid line -->
        <line x1="30" y1="${chartBottom}" x2="${svgWidth - 20}" y2="${chartBottom}" stroke="rgba(134, 128, 146, 0.2)" stroke-width="1" />
        ${barsSvg}
      </svg>
    `;
  }

  /**
   * Render Task Status Visual Distribution (Progress Breakdown)
   */
  function renderTaskStatusChart(tasks) {
    const container = document.getElementById('chartTaskContainer');
    if (!container) return;

    const total = tasks.length;
    if (total === 0) {
      container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 40px 0;">No task records available.</p>`;
      return;
    }

    const completed = tasks.filter(t => t.status === 'Completed').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const todo = tasks.filter(t => t.status === 'To Do').length;

    const compPct = Math.round((completed / total) * 100);
    const progPct = Math.round((inProgress / total) * 100);
    const todoPct = 100 - compPct - progPct;

    container.innerHTML = `
      <div style="padding: 12px 0;">
        <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 8px;">
          <span>Tasks Distribution</span>
          <span style="font-weight: 600; color: #fff;">${total} Total Tasks</span>
        </div>

        <!-- Segmented bar -->
        <div style="display: flex; height: 24px; border-radius: var(--radius-md); overflow: hidden; background: rgba(75, 61, 79, 0.3); border: 1px solid var(--border-subtle); margin-bottom: 16px;">
          <div style="width: ${compPct}%; background: var(--state-success); transition: width 0.4s ease;" title="Completed: ${completed} (${compPct}%)"></div>
          <div style="width: ${progPct}%; background: var(--state-warning); transition: width 0.4s ease;" title="In Progress: ${inProgress} (${progPct}%)"></div>
          <div style="width: ${todoPct}%; background: var(--c-lavender-grey); transition: width 0.4s ease;" title="To Do: ${todo} (${todoPct}%)"></div>
        </div>

        <div class="chart-legend">
          <div class="chart-legend-item">
            <span class="chart-legend-color" style="background: var(--state-success);"></span>
            <span>Completed (${completed} — ${compPct}%)</span>
          </div>
          <div class="chart-legend-item">
            <span class="chart-legend-color" style="background: var(--state-warning);"></span>
            <span>In Progress (${inProgress} — ${progPct}%)</span>
          </div>
          <div class="chart-legend-item">
            <span class="chart-legend-color" style="background: var(--c-lavender-grey);"></span>
            <span>To Do (${todo} — ${todoPct}%)</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Volunteer Engagement Distribution Chart
   */
  function renderVolunteerSkillsChart(volunteers) {
    const container = document.getElementById('chartVolunteerContainer');
    if (!container) return;

    const total = volunteers.length;
    if (total === 0) {
      container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 40px 0;">No volunteer records available.</p>`;
      return;
    }

    const active = volunteers.filter(v => v.status === 'Active').length;
    const inactive = total - active;
    const activePct = Math.round((active / total) * 100);
    const inactivePct = 100 - activePct;

    container.innerHTML = `
      <div style="padding: 12px 0;">
        <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 8px;">
          <span>Roster Availability Status</span>
          <span style="font-weight: 600; color: #fff;">${total} Registered Volunteers</span>
        </div>

        <div style="display: flex; height: 24px; border-radius: var(--radius-md); overflow: hidden; background: rgba(75, 61, 79, 0.3); border: 1px solid var(--border-subtle); margin-bottom: 16px;">
          <div style="width: ${activePct}%; background: var(--c-dusty-rose); transition: width 0.4s ease;" title="Active: ${active} (${activePct}%)"></div>
          <div style="width: ${inactivePct}%; background: rgba(134, 128, 146, 0.5); transition: width 0.4s ease;" title="Inactive: ${inactive} (${inactivePct}%)"></div>
        </div>

        <div class="chart-legend">
          <div class="chart-legend-item">
            <span class="chart-legend-color" style="background: var(--c-dusty-rose);"></span>
            <span>Active Mentors (${active} — ${activePct}%)</span>
          </div>
          <div class="chart-legend-item">
            <span class="chart-legend-color" style="background: rgba(134, 128, 146, 0.5);"></span>
            <span>Inactive / On-Leave (${inactive} — ${inactivePct}%)</span>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // CSV GENERATION & EXPORT LOGIC
  // =========================================================================

  /**
   * Escape and format a value for CSV inclusion
   */
  function csvEscape(val) {
    if (val === null || val === undefined) return '""';
    const stringVal = String(val);
    // Replace double quotes with pair of double quotes
    return `"${stringVal.replace(/"/g, '""')}"`;
  }

  /**
   * Download CSV string using Blob URL
   */
  function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    window.DawnBloom.showToast(`Exported ${filename} successfully.`, 'success');
  }

  function exportVolunteersCSV() {
    const volunteers = STORAGE.getCollection(KEYS.VOLUNTEERS);
    if (volunteers.length === 0) {
      window.DawnBloom.showToast('No volunteer records to export.', 'warning');
      return;
    }

    const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Skills', 'Area of Interest', 'Availability', 'Preferred Days', 'Join Date', 'Status', 'Notes'];
    const rows = volunteers.map(v => [
      csvEscape(v.id),
      csvEscape(v.name),
      csvEscape(v.email),
      csvEscape(v.phone),
      csvEscape(v.skills),
      csvEscape(v.interest),
      csvEscape(v.availability),
      csvEscape(v.preferredDays),
      csvEscape(v.joinDate),
      csvEscape(v.status),
      csvEscape(v.notes)
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\r\n');
    downloadCSV(csv, `DawnBloom_Volunteers_${new Date().toISOString().split('T')[0]}.csv`);
  }

  function exportStudentsCSV() {
    const students = STORAGE.getCollection(KEYS.STUDENTS);
    if (students.length === 0) {
      window.DawnBloom.showToast('No student records to export.', 'warning');
      return;
    }

    const headers = ['ID', 'Student Display Name', 'Age Group', 'Education Level', 'Guidance Subjects', 'Assigned Mentor', 'Enrollment Date', 'Support Status', 'Guidance Requirements'];
    const rows = students.map(s => [
      csvEscape(s.id),
      csvEscape(s.name),
      csvEscape(s.ageGroup),
      csvEscape(s.classLevel),
      csvEscape(s.subjects),
      csvEscape(s.assignedVolunteerName),
      csvEscape(s.enrollmentDate),
      csvEscape(s.status),
      csvEscape(s.guidanceNeeds)
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\r\n');
    downloadCSV(csv, `DawnBloom_Students_${new Date().toISOString().split('T')[0]}.csv`);
  }

  function exportGuidanceCSV() {
    const guidance = STORAGE.getCollection(KEYS.GUIDANCE);
    if (guidance.length === 0) {
      window.DawnBloom.showToast('No guidance session records to export.', 'warning');
      return;
    }

    const headers = ['Session ID', 'Topic / Title', 'Subject', 'Student', 'Volunteer Mentor', 'Date', 'Start Time', 'End Time', 'Venue', 'Status', 'Notes'];
    const rows = guidance.map(g => [
      csvEscape(g.id),
      csvEscape(g.title),
      csvEscape(g.subject),
      csvEscape(g.studentName),
      csvEscape(g.volunteerName),
      csvEscape(g.date),
      csvEscape(g.startTime),
      csvEscape(g.endTime),
      csvEscape(g.venue),
      csvEscape(g.status),
      csvEscape(g.notes)
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\r\n');
    downloadCSV(csv, `DawnBloom_Guidance_Sessions_${new Date().toISOString().split('T')[0]}.csv`);
  }

  function exportEventsCSV() {
    const events = STORAGE.getCollection(KEYS.EVENTS);
    if (events.length === 0) {
      window.DawnBloom.showToast('No event records to export.', 'warning');
      return;
    }

    const headers = ['Event ID', 'Event Name', 'Category', 'Date', 'Start Time', 'End Time', 'Location', 'Assigned Volunteers', 'Expected Participants', 'Status', 'Description'];
    const rows = events.map(e => [
      csvEscape(e.id),
      csvEscape(e.name),
      csvEscape(e.category),
      csvEscape(e.date),
      csvEscape(e.startTime),
      csvEscape(e.endTime),
      csvEscape(e.location),
      csvEscape(e.assignedVolunteerNames),
      csvEscape(e.expectedParticipants),
      csvEscape(e.status),
      csvEscape(e.description)
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\r\n');
    downloadCSV(csv, `DawnBloom_Events_${new Date().toISOString().split('T')[0]}.csv`);
  }

  function exportTasksCSV() {
    const tasks = STORAGE.getCollection(KEYS.TASKS);
    if (tasks.length === 0) {
      window.DawnBloom.showToast('No task records to export.', 'warning');
      return;
    }

    const headers = ['Task ID', 'Title', 'Assigned Volunteer', 'Priority', 'Due Date', 'Status', 'Related Event', 'Description'];
    const rows = tasks.map(t => [
      csvEscape(t.id),
      csvEscape(t.title),
      csvEscape(t.assignedVolunteerName),
      csvEscape(t.priority),
      csvEscape(t.dueDate),
      csvEscape(t.status),
      csvEscape(t.relatedEventName),
      csvEscape(t.description)
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\r\n');
    downloadCSV(csv, `DawnBloom_Tasks_${new Date().toISOString().split('T')[0]}.csv`);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
