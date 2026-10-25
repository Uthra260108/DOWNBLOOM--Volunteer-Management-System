/**
 * DAWNBLOOM — Guidance Session Management Controller
 * Handles scheduling, editing, status changes (complete/cancel),
 * time validation (endTime > startTime), volunteer overlap detection,
 * separate upcoming vs completed tabs, and search/filtering.
 */

(function (window) {
  'use strict';

  const STORAGE = window.DawnBloomStorage;
  const KEYS = STORAGE.KEYS;

  let currentSessions = [];
  let currentVolunteers = [];
  let currentStudents = [];
  let editingSessionId = null;
  let activeTab = 'upcoming'; // 'upcoming' | 'completed' | 'all'

  // DOM Elements
  let sessionTableBody;
  let searchInput;
  let statusFilter;
  let volunteerFilter;
  let modalOverlay;
  let sessionForm;
  let modalTitle;
  let studentSelect;
  let volunteerSelect;
  let tabUpcoming;
  let tabCompleted;
  let tabAll;

  function init() {
    sessionTableBody = document.getElementById('sessionTableBody');
    searchInput = document.getElementById('searchGuidance');
    statusFilter = document.getElementById('filterGuidanceStatus');
    volunteerFilter = document.getElementById('filterGuidanceVolunteer');
    modalOverlay = document.getElementById('guidanceModal');
    sessionForm = document.getElementById('guidanceForm');
    modalTitle = document.getElementById('guidanceModalTitle');
    studentSelect = document.getElementById('sessionStudent');
    volunteerSelect = document.getElementById('sessionVolunteer');

    tabUpcoming = document.getElementById('tabUpcoming');
    tabCompleted = document.getElementById('tabCompleted');
    tabAll = document.getElementById('tabAll');

    // Tabs
    if (tabUpcoming) {
      tabUpcoming.addEventListener('click', () => switchTab('upcoming'));
    }
    if (tabCompleted) {
      tabCompleted.addEventListener('click', () => switchTab('completed'));
    }
    if (tabAll) {
      tabAll.addEventListener('click', () => switchTab('all'));
    }

    // Filter listeners
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    if (volunteerFilter) volunteerFilter.addEventListener('change', applyFilters);

    // Modal controls
    const addBtn = document.getElementById('btnScheduleSession');
    if (addBtn) addBtn.addEventListener('click', () => openFormModal());

    const cancelModalBtn = document.getElementById('btnCancelGuidanceModal');
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeFormModal);

    const closeModalBtn = document.getElementById('guidanceModalCloseBtn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeFormModal);

    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeFormModal();
      });
    }

    if (sessionForm) {
      sessionForm.addEventListener('submit', handleFormSubmit);
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      openFormModal();
    }

    loadData();
  }

  function loadData() {
    currentSessions = STORAGE.getCollection(KEYS.GUIDANCE);
    currentVolunteers = STORAGE.getCollection(KEYS.VOLUNTEERS);
    currentStudents = STORAGE.getCollection(KEYS.STUDENTS);

    populateDropdowns();
    applyFilters();
  }

  function populateDropdowns() {
    // 1. Volunteer options for form and filter
    const activeVols = currentVolunteers.filter(v => v.status === 'Active');

    if (volunteerSelect) {
      volunteerSelect.innerHTML = `
        <option value="">— Select Volunteer Mentor —</option>
        ${activeVols.map(v => `<option value="${v.id}">${STORAGE.escapeHtml(v.name)} (${STORAGE.escapeHtml(v.skills.substring(0, 20))}...)</option>`).join('')}
      `;
    }

    if (volunteerFilter) {
      const user = window.DawnBloomAuth.getCurrentUser();
      const userVolId = (user && user.role === 'Volunteer') ? (user.volunteerId || (currentVolunteers.find(v => v.email && user.email && v.email.toLowerCase() === user.email.toLowerCase()) || {}).id) : null;

      volunteerFilter.innerHTML = `
        <option value="all">All Mentors</option>
        ${currentVolunteers.map(v => `<option value="${v.id}" ${userVolId && v.id === userVolId ? 'selected' : ''}>${STORAGE.escapeHtml(v.name)}</option>`).join('')}
      `;
    }

    // 2. Student options for form
    if (studentSelect) {
      studentSelect.innerHTML = `
        <option value="">— Select Student —</option>
        ${currentStudents.map(s => `<option value="${s.id}">${STORAGE.escapeHtml(s.name)} (${STORAGE.escapeHtml(s.classLevel)})</option>`).join('')}
      `;
    }
  }

  function switchTab(tab) {
    activeTab = tab;
    [tabUpcoming, tabCompleted, tabAll].forEach(el => {
      if (el) el.classList.remove('active');
    });

    if (tab === 'upcoming' && tabUpcoming) tabUpcoming.classList.add('active');
    if (tab === 'completed' && tabCompleted) tabCompleted.classList.add('active');
    if (tab === 'all' && tabAll) tabAll.classList.add('active');

    applyFilters();
  }

  function applyFilters() {
    let list = [...currentSessions];

    // Filter by Tab
    if (activeTab === 'upcoming') {
      list = list.filter(s => s.status === 'Scheduled');
    } else if (activeTab === 'completed') {
      list = list.filter(s => s.status === 'Completed');
    }

    // Search query
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    if (query) {
      list = list.filter(s =>
        (s.title || '').toLowerCase().includes(query) ||
        (s.subject || '').toLowerCase().includes(query) ||
        (s.studentName || '').toLowerCase().includes(query) ||
        (s.volunteerName || '').toLowerCase().includes(query) ||
        (s.venue || '').toLowerCase().includes(query)
      );
    }

    // Status filter (active in 'all' tab or overriding)
    const status = statusFilter ? statusFilter.value : 'all';
    if (status && status !== 'all') {
      list = list.filter(s => s.status === status);
    }

    // Volunteer filter
    const volId = volunteerFilter ? volunteerFilter.value : 'all';
    if (volId && volId !== 'all') {
      list = list.filter(s => s.volunteerId === volId);
    }

    // Sort by date (nearest upcoming first)
    list.sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.startTime || '').localeCompare(b.startTime || ''));

    renderTable(list);
  }

  function renderTable(list) {
    if (!sessionTableBody) return;

    const countBadge = document.getElementById('sessionCountBadge');
    if (countBadge) {
      countBadge.textContent = `${list.length} Session${list.length === 1 ? '' : 's'}`;
    }

    if (list.length === 0) {
      sessionTableBody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state" style="border: none;">
              <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
              <h3 class="empty-state-title">No Guidance Sessions Found</h3>
              <p class="empty-state-desc">No sessions match your active tab and filter criteria.</p>
              <button type="button" class="btn btn-primary btn-sm" onclick="window.DawnBloomGuidance.openCreateModal()">
                Schedule Session
              </button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    sessionTableBody.innerHTML = list.map(s => {
      let badge = '<span class="badge badge-scheduled">Scheduled</span>';
      if (s.status === 'Completed') {
        badge = '<span class="badge badge-completed">Completed</span>';
      } else if (s.status === 'Cancelled') {
        badge = '<span class="badge badge-cancelled">Cancelled</span>';
      }

      return `
        <tr>
          <td>
            <div style="font-weight: 600; color: #fff;">${STORAGE.escapeHtml(s.title)}</div>
            <div style="font-size: 0.78rem; color: var(--c-blush-pink);">${STORAGE.escapeHtml(s.subject)}</div>
          </td>
          <td>
            <div style="font-size: 0.88rem; color: var(--text-primary); font-weight: 500;">${STORAGE.escapeHtml(s.studentName)}</div>
            <div style="font-size: 0.76rem; color: var(--text-muted);">${STORAGE.escapeHtml(s.venue || 'Study Room')}</div>
          </td>
          <td>
            <div style="font-size: 0.88rem; color: var(--text-secondary);">${STORAGE.escapeHtml(s.volunteerName)}</div>
          </td>
          <td>
            <div style="font-size: 0.88rem; color: #fff;">${window.DawnBloom.formatDate(s.date)}</div>
            <div style="font-size: 0.76rem; color: var(--text-muted);">
              ${window.DawnBloom.formatTime(s.startTime)} – ${window.DawnBloom.formatTime(s.endTime)}
            </div>
          </td>
          <td>${badge}</td>
          <td>
            <div class="table-actions">
              ${s.status === 'Scheduled' ? `
                <button type="button" class="btn btn-outline btn-sm" style="color: var(--state-success); border-color: rgba(92,174,139,0.4);" onclick="window.DawnBloomGuidance.markComplete('${s.id}')" title="Mark Completed">
                  Complete
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.DawnBloomGuidance.openEditModal('${s.id}')" title="Edit Session">
                  Edit
                </button>
                <button type="button" class="btn btn-outline btn-sm" style="color: var(--state-danger);" onclick="window.DawnBloomGuidance.cancelSession('${s.id}')" title="Cancel Session">
                  Cancel
                </button>
              ` : `
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.DawnBloomGuidance.openEditModal('${s.id}')" title="Edit Session">
                  Edit
                </button>
                <button type="button" class="btn btn-danger btn-sm" onclick="window.DawnBloomGuidance.deleteSession('${s.id}')" title="Delete Record">
                  Delete
                </button>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function openFormModal(session = null) {
    editingSessionId = session ? session.id : null;
    modalTitle.textContent = session ? 'Edit Guidance Session' : 'Schedule Educational Guidance Session';
    populateDropdowns();

    const currentUser = window.DawnBloomAuth.getCurrentUser();
    const defaultVolId = (currentUser && currentUser.role === 'Volunteer') ? (currentUser.volunteerId || (currentVolunteers.find(v => v.email && currentUser.email && v.email.toLowerCase() === currentUser.email.toLowerCase()) || {}).id) : '';

    document.getElementById('sessionTitle').value = session ? session.title : '';
    document.getElementById('sessionSubject').value = session ? session.subject : '';
    document.getElementById('sessionStudent').value = session ? session.studentId : '';
    document.getElementById('sessionVolunteer').value = session ? session.volunteerId : (defaultVolId || '');
    document.getElementById('sessionDate').value = session ? session.date : new Date().toISOString().split('T')[0];
    document.getElementById('sessionStartTime').value = session ? session.startTime : '10:00';
    document.getElementById('sessionEndTime').value = session ? session.endTime : '11:00';
    document.getElementById('sessionVenue').value = session ? session.venue : 'Study Hall B';
    document.getElementById('sessionStatus').value = session ? session.status : 'Scheduled';
    document.getElementById('sessionNotes').value = session ? (session.notes || '') : '';

    modalOverlay.classList.add('open');
  }

  function closeFormModal() {
    modalOverlay.classList.remove('open');
    if (sessionForm) sessionForm.reset();
    editingSessionId = null;
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('sessionTitle').value.trim();
    const subject = document.getElementById('sessionSubject').value.trim();
    const studentId = document.getElementById('sessionStudent').value;
    const volunteerId = document.getElementById('sessionVolunteer').value;
    const date = document.getElementById('sessionDate').value;
    const startTime = document.getElementById('sessionStartTime').value;
    const endTime = document.getElementById('sessionEndTime').value;
    const venue = document.getElementById('sessionVenue').value.trim();
    const status = document.getElementById('sessionStatus').value;
    const notes = document.getElementById('sessionNotes').value.trim();

    if (!title || !studentId || !volunteerId || !date || !startTime || !endTime) {
      window.DawnBloom.showToast('Please fill in all required fields.', 'error');
      return;
    }

    // Validation: End time must be later than start time!
    if (endTime <= startTime) {
      window.DawnBloom.showToast('Session End Time must be later than Start Time.', 'error');
      return;
    }

    // Overlap validation: check if the same volunteer is scheduled for overlapping times on the same date!
    const volunteerOverlap = currentSessions.find(s => 
      s.id !== editingSessionId &&
      s.volunteerId === volunteerId &&
      s.date === date &&
      s.status !== 'Cancelled' &&
      // Overlap condition: (StartA < EndB) and (EndA > StartB)
      startTime < s.endTime && endTime > s.startTime
    );

    if (volunteerOverlap) {
      window.DawnBloom.confirm({
        title: 'Volunteer Schedule Overlap Warning',
        message: `Volunteer already has another session ("${volunteerOverlap.title}") scheduled on ${date} from ${volunteerOverlap.startTime} to ${volunteerOverlap.endTime}. Do you want to schedule anyway?`,
        confirmText: 'Schedule Anyway',
        cancelText: 'Adjust Time'
      }).then(confirmed => {
        if (confirmed) {
          saveSessionRecord({ title, subject, studentId, volunteerId, date, startTime, endTime, venue, status, notes });
        }
      });
      return;
    }

    saveSessionRecord({ title, subject, studentId, volunteerId, date, startTime, endTime, venue, status, notes });
  }

  function saveSessionRecord({ title, subject, studentId, volunteerId, date, startTime, endTime, venue, status, notes }) {
    const student = currentStudents.find(s => s.id === studentId);
    const volunteer = currentVolunteers.find(v => v.id === volunteerId);

    const payload = {
      title,
      subject,
      studentId,
      studentName: student ? student.name : 'Unknown Student',
      volunteerId,
      volunteerName: volunteer ? volunteer.name : 'Unknown Volunteer',
      date,
      startTime,
      endTime,
      venue,
      status,
      notes
    };

    if (editingSessionId) {
      STORAGE.updateItem(KEYS.GUIDANCE, editingSessionId, payload);
      window.DawnBloom.showToast('Guidance session updated.', 'success');
    } else {
      payload.id = STORAGE.generateId('GID');
      STORAGE.addItem(KEYS.GUIDANCE, payload);
      window.DawnBloom.showToast('New guidance session scheduled.', 'success');
    }

    closeFormModal();
    loadData();
  }

  function markComplete(id) {
    STORAGE.updateItem(KEYS.GUIDANCE, id, { status: 'Completed' });
    window.DawnBloom.showToast('Session marked as Completed!', 'success');
    loadData();
  }

  function cancelSession(id) {
    window.DawnBloom.confirm({
      title: 'Cancel Session',
      message: 'Are you sure you want to mark this guidance session as Cancelled?',
      confirmText: 'Cancel Session',
      cancelText: 'Keep Scheduled',
      isDanger: true
    }).then(confirmed => {
      if (confirmed) {
        STORAGE.updateItem(KEYS.GUIDANCE, id, { status: 'Cancelled' });
        window.DawnBloom.showToast('Session marked as Cancelled.', 'info');
        loadData();
      }
    });
  }

  function deleteSession(id) {
    window.DawnBloom.confirm({
      title: 'Delete Session Record',
      message: 'Are you sure you want to permanently delete this guidance session record?',
      confirmText: 'Delete Record',
      cancelText: 'Cancel',
      isDanger: true
    }).then(confirmed => {
      if (confirmed) {
        STORAGE.deleteItem(KEYS.GUIDANCE, id);
        window.DawnBloom.showToast('Session record deleted.', 'info');
        loadData();
      }
    });
  }

  function openEditModal(id) {
    const session = currentSessions.find(s => s.id === id);
    if (session) openFormModal(session);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.DawnBloomGuidance = {
    openCreateModal: () => openFormModal(),
    openEditModal,
    markComplete,
    cancelSession,
    deleteSession
  };

})(window);
