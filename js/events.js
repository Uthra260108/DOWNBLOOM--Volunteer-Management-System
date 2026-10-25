/**
 * DAWNBLOOM — Events & Scheduling Controller
 * Full CRUD, multi-volunteer assignments, date/time validation (endTime > startTime),
 * category/status filtering, search, and detail modal.
 */

(function (window) {
  'use strict';

  const STORAGE = window.DawnBloomStorage;
  const KEYS = STORAGE.KEYS;

  let currentEvents = [];
  let currentVolunteers = [];
  let editingEventId = null;
  let activeView = 'upcoming'; // 'upcoming' | 'history' | 'all'

  // DOM Elements
  let eventGridContainer;
  let searchInput;
  let categoryFilter;
  let statusFilter;
  let modalOverlay;
  let eventForm;
  let modalTitle;
  let volunteersCheckboxContainer;
  let detailModalOverlay;
  let detailContent;

  function init() {
    eventGridContainer = document.getElementById('eventsGrid');
    searchInput = document.getElementById('searchEvent');
    categoryFilter = document.getElementById('filterEventCategory');
    statusFilter = document.getElementById('filterEventStatus');
    modalOverlay = document.getElementById('eventModal');
    eventForm = document.getElementById('eventForm');
    modalTitle = document.getElementById('eventModalTitle');
    volunteersCheckboxContainer = document.getElementById('eventVolunteersCheckboxes');
    detailModalOverlay = document.getElementById('eventDetailModal');
    detailContent = document.getElementById('eventDetailContent');

    // Event History / Upcoming Navigation Tabs
    const tabUpcoming = document.getElementById('tabUpcomingEvents');
    const tabPast = document.getElementById('tabPastEvents');
    const tabAll = document.getElementById('tabAllEvents');
    const allViewTabs = [tabUpcoming, tabPast, tabAll];

    function setView(view) {
      activeView = view;
      allViewTabs.forEach(t => {
        if (!t) return;
        if (t.getAttribute('data-view') === view) t.classList.add('active');
        else t.classList.remove('active');
      });
      applyFilters();
    }

    if (tabUpcoming) tabUpcoming.addEventListener('click', () => setView('upcoming'));
    if (tabPast) tabPast.addEventListener('click', () => setView('history'));
    if (tabAll) tabAll.addEventListener('click', () => setView('all'));

    // Event listeners
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);

    // Modal buttons
    const addBtn = document.getElementById('btnAddEvent');
    if (addBtn) addBtn.addEventListener('click', () => openFormModal());

    const cancelModalBtn = document.getElementById('btnCancelEventModal');
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeFormModal);

    const closeModalBtn = document.getElementById('eventModalCloseBtn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeFormModal);

    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeFormModal();
      });
    }

    // Detail modal close
    const closeDetailBtn = document.getElementById('eventDetailCloseBtn');
    const closeDetailFooterBtn = document.getElementById('btnEventDetailClose');
    if (closeDetailBtn) closeDetailBtn.addEventListener('click', closeDetailModal);
    if (closeDetailFooterBtn) closeDetailFooterBtn.addEventListener('click', closeDetailModal);
    if (detailModalOverlay) {
      detailModalOverlay.addEventListener('click', (e) => {
        if (e.target === detailModalOverlay) closeDetailModal();
      });
    }

    if (eventForm) {
      eventForm.addEventListener('submit', handleFormSubmit);
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      openFormModal();
    }

    loadData();
  }

  function loadData() {
    currentEvents = STORAGE.getCollection(KEYS.EVENTS);
    currentVolunteers = STORAGE.getCollection(KEYS.VOLUNTEERS);
    populateVolunteerCheckboxes();
    applyFilters();
  }

  function populateVolunteerCheckboxes(selectedIds = []) {
    if (!volunteersCheckboxContainer) return;
    const activeVols = currentVolunteers.filter(v => v.status === 'Active');

    if (activeVols.length === 0) {
      volunteersCheckboxContainer.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted);">No active volunteers registered yet.</span>`;
      return;
    }

    volunteersCheckboxContainer.innerHTML = activeVols.map(v => {
      const isChecked = selectedIds.includes(v.id) ? 'checked' : '';
      return `
        <label class="form-check" style="margin-bottom: 6px;">
          <input type="checkbox" name="eventVolunteerOption" value="${v.id}" ${isChecked}>
          <span>${STORAGE.escapeHtml(v.name)} <small style="color: var(--text-muted);">(${STORAGE.escapeHtml(v.skills.substring(0, 20))}...)</small></span>
        </label>
      `;
    }).join('');
  }

  function applyFilters() {
    let list = [...currentEvents];
    const todayStr = new Date().toISOString().split('T')[0];

    // Filter by Active View Tab (Upcoming vs History)
    const headingEl = document.getElementById('eventSectionHeading');
    if (activeView === 'upcoming') {
      list = list.filter(e => e.status === 'Scheduled' || (e.status !== 'Cancelled' && (e.date || '') >= todayStr));
      list.sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.startTime || '').localeCompare(b.startTime || ''));
      if (headingEl) headingEl.textContent = 'Scheduled Programmes & Upcoming Events';
    } else if (activeView === 'history') {
      list = list.filter(e => e.status === 'Completed' || ((e.date || '') < todayStr && e.status !== 'Cancelled'));
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      if (headingEl) headingEl.textContent = '📜 Past Events & Outcomes History Archive';
    } else {
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      if (headingEl) headingEl.textContent = 'All Historical & Scheduled Events';
    }

    // Search query
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    if (query) {
      list = list.filter(e =>
        (e.name || '').toLowerCase().includes(query) ||
        (e.category || '').toLowerCase().includes(query) ||
        (e.location || '').toLowerCase().includes(query) ||
        (e.description || '').toLowerCase().includes(query) ||
        (e.assignedVolunteerNames || '').toLowerCase().includes(query)
      );
    }

    // Category filter
    const cat = categoryFilter ? categoryFilter.value : 'all';
    if (cat && cat !== 'all') {
      list = list.filter(e => e.category === cat);
    }

    // Status filter
    const status = statusFilter ? statusFilter.value : 'all';
    if (status && status !== 'all') {
      list = list.filter(e => e.status === status);
    }

    renderCards(list);
  }

  function renderCards(list) {
    if (!eventGridContainer) return;

    const countBadge = document.getElementById('eventCountBadge');
    if (countBadge) {
      countBadge.textContent = `${list.length} Event${list.length === 1 ? '' : 's'}`;
    }

    if (list.length === 0) {
      const isHistory = activeView === 'history';
      eventGridContainer.innerHTML = `
        <div style="grid-column: 1 / -1;">
          <div class="empty-state">
            <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <h3 class="empty-state-title">${isHistory ? 'No Past Events Found' : 'No Events Found'}</h3>
            <p class="empty-state-desc">${isHistory ? 'Completed events and activity milestones will appear here in the history archive.' : 'Try clearing your search query or schedule a new event or educational workshop.'}</p>
            <button type="button" class="btn btn-primary btn-sm" onclick="window.DawnBloomEvents.openCreateModal()">
              Create Event
            </button>
          </div>
        </div>
      `;
      return;
    }

    eventGridContainer.innerHTML = list.map(evt => {
      let statusBadge = '<span class="badge badge-scheduled">Scheduled</span>';
      if (evt.status === 'Completed') statusBadge = '<span class="badge badge-completed">Completed</span>';
      else if (evt.status === 'Cancelled') statusBadge = '<span class="badge badge-cancelled">Cancelled</span>';

      return `
        <div class="item-card">
          <div>
            <div class="item-card-header">
              <div>
                <span class="badge badge-tag" style="margin-bottom: 6px;">${STORAGE.escapeHtml(evt.category)}</span>
                <h3 class="item-card-title">${STORAGE.escapeHtml(evt.name)}</h3>
              </div>
              ${statusBadge}
            </div>

            <p class="item-card-desc">${STORAGE.escapeHtml(evt.description)}</p>

            <div class="item-card-meta">
              <div class="item-card-meta-row">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span style="color: #fff; font-weight: 500;">${window.DawnBloom.formatDate(evt.date)}</span>
                <span>•</span>
                <span>${window.DawnBloom.formatTime(evt.startTime)} – ${window.DawnBloom.formatTime(evt.endTime)}</span>
              </div>
              <div class="item-card-meta-row">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>${STORAGE.escapeHtml(evt.location || 'Orphanage Grounds')}</span>
              </div>
              <div class="item-card-meta-row">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                <span>Mentors: <strong>${STORAGE.escapeHtml(evt.assignedVolunteerNames || 'Unassigned')}</strong></span>
              </div>
              <div class="item-card-meta-row">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                <span>${evt.expectedParticipants || 20} Expected / Attended Children</span>
              </div>

              ${evt.outcome ? `
                <div style="margin-top: 10px; background: rgba(75, 61, 79, 0.25); border-left: 3px solid var(--c-blush-pink); border-radius: var(--radius-sm); padding: 8px 12px; font-size: 0.8rem; color: var(--text-secondary);">
                  <strong style="color: #fff;">Recorded Outcome:</strong> ${STORAGE.escapeHtml(evt.outcome)}
                </div>
              ` : ''}
            </div>
          </div>

          <div class="item-card-footer">
            <button type="button" class="btn btn-outline btn-sm" onclick="window.DawnBloomEvents.viewDetails('${evt.id}')">
              Details & History
            </button>
            <div style="display: flex; gap: 6px;">
              ${evt.status === 'Scheduled' ? `
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.DawnBloomEvents.markCompleted('${evt.id}')" title="Mark Finished">
                  Done
                </button>
              ` : ''}
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.DawnBloomEvents.openEditModal('${evt.id}')">
                Edit
              </button>
              <button type="button" class="btn btn-danger btn-sm" onclick="window.DawnBloomEvents.deleteEvent('${evt.id}')">
                Delete
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function openFormModal(evt = null) {
    editingEventId = evt ? evt.id : null;
    modalTitle.textContent = evt ? 'Edit Event Details' : 'Create & Schedule New Event';

    const selectedVolIds = evt ? (evt.assignedVolunteers || []) : [];
    populateVolunteerCheckboxes(selectedVolIds);

    document.getElementById('evtName').value = evt ? evt.name : '';
    document.getElementById('evtCategory').value = evt ? evt.category : 'Educational Workshop';
    document.getElementById('evtDate').value = evt ? evt.date : new Date().toISOString().split('T')[0];
    document.getElementById('evtStartTime').value = evt ? evt.startTime : '09:30';
    document.getElementById('evtEndTime').value = evt ? evt.endTime : '12:00';
    document.getElementById('evtLocation').value = evt ? evt.location : 'Main Community Hall';
    document.getElementById('evtParticipants').value = evt ? evt.expectedParticipants : 25;
    document.getElementById('evtStatus').value = evt ? evt.status : 'Scheduled';
    document.getElementById('evtDescription').value = evt ? evt.description : '';

    modalOverlay.classList.add('open');
  }

  function closeFormModal() {
    modalOverlay.classList.remove('open');
    if (eventForm) eventForm.reset();
    editingEventId = null;
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('evtName').value.trim();
    const category = document.getElementById('evtCategory').value;
    const date = document.getElementById('evtDate').value;
    const startTime = document.getElementById('evtStartTime').value;
    const endTime = document.getElementById('evtEndTime').value;
    const location = document.getElementById('evtLocation').value.trim();
    const expectedParticipants = parseInt(document.getElementById('evtParticipants').value, 10) || 20;
    const status = document.getElementById('evtStatus').value;
    const description = document.getElementById('evtDescription').value.trim();

    if (!name || !date || !startTime || !endTime) {
      window.DawnBloom.showToast('Please fill in all required event details.', 'error');
      return;
    }

    // Validation: End time must be later than start time!
    if (endTime <= startTime) {
      window.DawnBloom.showToast('Event End Time must be later than Start Time.', 'error');
      return;
    }

    // Collect checked volunteers
    const checkedBoxes = document.querySelectorAll('input[name="eventVolunteerOption"]:checked');
    const assignedVolunteers = Array.from(checkedBoxes).map(cb => cb.value);

    // Map volunteer names
    const assignedVolunteerNames = assignedVolunteers.map(id => {
      const vol = currentVolunteers.find(v => v.id === id);
      return vol ? vol.name : id;
    }).join(', ') || 'Unassigned';

    const payload = {
      name,
      category,
      date,
      startTime,
      endTime,
      location,
      expectedParticipants,
      status,
      description,
      assignedVolunteers,
      assignedVolunteerNames
    };

    if (editingEventId) {
      STORAGE.updateItem(KEYS.EVENTS, editingEventId, payload);
      window.DawnBloom.showToast('Event updated successfully.', 'success');
    } else {
      payload.id = STORAGE.generateId('EVT');
      STORAGE.addItem(KEYS.EVENTS, payload);
      window.DawnBloom.showToast('New event scheduled successfully.', 'success');
    }

    closeFormModal();
    loadData();
  }

  function viewDetails(id) {
    const evt = currentEvents.find(e => e.id === id);
    if (!evt || !detailModalOverlay || !detailContent) return;

    detailContent.innerHTML = `
      <div style="margin-bottom: 16px;">
        <span class="badge badge-tag" style="margin-bottom: 6px;">${STORAGE.escapeHtml(evt.category)}</span>
        <h3 style="font-size: 1.3rem; font-weight: 700; color: #fff;">${STORAGE.escapeHtml(evt.name)}</h3>
        <div style="display: flex; gap: 8px; align-items: center; margin-top: 6px;">
          <span class="badge ${evt.status === 'Scheduled' ? 'badge-scheduled' : (evt.status === 'Completed' ? 'badge-completed' : 'badge-cancelled')}">${STORAGE.escapeHtml(evt.status)}</span>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${evt.expectedParticipants || 20} Expected Children</span>
        </div>
      </div>

      <div style="margin-bottom: 16px;">
        <div style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Description</div>
        <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; background: rgba(75, 61, 79, 0.2); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
          ${STORAGE.escapeHtml(evt.description || 'No detailed description provided.')}
        </p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; font-size: 0.88rem;">
        <div>
          <div style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase;">Date & Time</div>
          <div style="color: #fff; font-weight: 500;">${window.DawnBloom.formatDate(evt.date)}</div>
          <div style="color: var(--c-blush-pink); font-size: 0.8rem;">${window.DawnBloom.formatTime(evt.startTime)} – ${window.DawnBloom.formatTime(evt.endTime)}</div>
        </div>
        <div>
          <div style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase;">Location / Venue</div>
          <div style="color: var(--text-primary); font-weight: 500;">${STORAGE.escapeHtml(evt.location || 'Orphanage Grounds')}</div>
        </div>
      </div>

      <div>
        <div style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">Assigned Volunteer Mentors</div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${(evt.assignedVolunteerNames || 'Unassigned').split(', ').map(name => `
            <span class="badge" style="background: rgba(178, 108, 134, 0.25); color: #fff; padding: 4px 10px;">${STORAGE.escapeHtml(name)}</span>
          `).join('')}
        </div>
      </div>

      ${evt.outcome ? `
        <div style="margin-top: 14px;">
          <div style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">Recorded Outcome & Impact History</div>
          <div style="padding: 12px; background: rgba(75, 61, 79, 0.35); border-left: 3px solid var(--c-blush-pink); border-radius: var(--radius-sm); font-size: 0.88rem; color: #fff; line-height: 1.45;">
            ${STORAGE.escapeHtml(evt.outcome)}
          </div>
        </div>
      ` : ''}
    `;

    detailModalOverlay.classList.add('open');
  }

  function closeDetailModal() {
    if (detailModalOverlay) detailModalOverlay.classList.remove('open');
  }

  function openEditModal(id) {
    const evt = currentEvents.find(e => e.id === id);
    if (evt) openFormModal(evt);
  }

  function markCompleted(id) {
    STORAGE.updateItem(KEYS.EVENTS, id, { status: 'Completed' });
    window.DawnBloom.showToast('Event marked as Completed!', 'success');
    loadData();
  }

  function deleteEvent(id) {
    const evt = currentEvents.find(e => e.id === id);
    if (!evt) return;

    window.DawnBloom.confirm({
      title: 'Delete Event',
      message: `Are you sure you want to permanently delete event "${evt.name}"? This action cannot be undone.`,
      confirmText: 'Delete Event',
      cancelText: 'Cancel',
      isDanger: true
    }).then(confirmed => {
      if (confirmed) {
        STORAGE.deleteItem(KEYS.EVENTS, id);
        window.DawnBloom.showToast(`Event "${evt.name}" deleted.`, 'info');
        loadData();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.DawnBloomEvents = {
    openCreateModal: () => openFormModal(),
    openEditModal,
    viewDetails,
    markCompleted,
    deleteEvent
  };

})(window);
