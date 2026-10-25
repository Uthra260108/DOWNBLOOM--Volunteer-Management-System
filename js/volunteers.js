/**
 * DAWNBLOOM — Volunteer Management Controller
 * Full CRUD, search, status/skills/availability filtering, alphabetical sorting,
 * detail modal, duplicate checks, and persistence.
 */

(function (window) {
  'use strict';

  const STORAGE = window.DawnBloomStorage;
  const KEYS = STORAGE.KEYS;

  let currentVolunteers = [];
  let editingVolunteerId = null;

  // DOM Elements
  let volunteerTableBody;
  let searchInput;
  let statusFilter;
  let availabilityFilter;
  let sortSelect;
  let modalOverlay;
  let volunteerForm;
  let modalTitle;
  let detailModalOverlay;
  let detailContent;

  function init() {
    volunteerTableBody = document.getElementById('volunteerTableBody');
    searchInput = document.getElementById('searchVolunteer');
    statusFilter = document.getElementById('filterStatus');
    availabilityFilter = document.getElementById('filterAvailability');
    sortSelect = document.getElementById('sortVolunteers');
    modalOverlay = document.getElementById('volunteerModal');
    volunteerForm = document.getElementById('volunteerForm');
    modalTitle = document.getElementById('modalTitle');
    detailModalOverlay = document.getElementById('volunteerDetailModal');
    detailContent = document.getElementById('volunteerDetailContent');

    // Event listeners
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    if (availabilityFilter) availabilityFilter.addEventListener('change', applyFilters);
    if (sortSelect) sortSelect.addEventListener('change', applyFilters);

    // Modal open buttons
    const addBtn = document.getElementById('btnAddVolunteer');
    if (addBtn) {
      addBtn.addEventListener('click', () => openFormModal());
    }

    const cancelModalBtn = document.getElementById('btnCancelModal');
    if (cancelModalBtn) {
      cancelModalBtn.addEventListener('click', closeFormModal);
    }

    const closeModalBtn = document.getElementById('modalCloseBtn');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', closeFormModal);
    }

    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeFormModal();
      });
    }

    // Detail modal close
    const closeDetailBtn = document.getElementById('detailCloseBtn');
    const closeDetailFooterBtn = document.getElementById('btnDetailClose');
    if (closeDetailBtn) closeDetailBtn.addEventListener('click', closeDetailModal);
    if (closeDetailFooterBtn) closeDetailFooterBtn.addEventListener('click', closeDetailModal);
    if (detailModalOverlay) {
      detailModalOverlay.addEventListener('click', (e) => {
        if (e.target === detailModalOverlay) closeDetailModal();
      });
    }

    // Form submit
    if (volunteerForm) {
      volunteerForm.addEventListener('submit', handleFormSubmit);
    }

    // Check if URL has ?action=new
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      openFormModal();
    }

    loadVolunteers();
  }

  function loadVolunteers() {
    currentVolunteers = STORAGE.getCollection(KEYS.VOLUNTEERS);
    applyFilters();
  }

  function applyFilters() {
    let list = [...currentVolunteers];

    // Search query
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    if (query) {
      list = list.filter(v => 
        (v.name || '').toLowerCase().includes(query) ||
        (v.email || '').toLowerCase().includes(query) ||
        (v.skills || '').toLowerCase().includes(query) ||
        (v.interest || '').toLowerCase().includes(query)
      );
    }

    // Status filter
    const status = statusFilter ? statusFilter.value : 'all';
    if (status && status !== 'all') {
      list = list.filter(v => v.status === status);
    }

    // Availability filter
    const avail = availabilityFilter ? availabilityFilter.value : 'all';
    if (avail && avail !== 'all') {
      list = list.filter(v => (v.availability || '').toLowerCase().includes(avail.toLowerCase()));
    }

    // Sort
    const sortVal = sortSelect ? sortSelect.value : 'name-asc';
    if (sortVal === 'name-asc') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortVal === 'name-desc') {
      list.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (sortVal === 'date-desc') {
      list.sort((a, b) => (b.joinDate || '').localeCompare(a.joinDate || ''));
    } else if (sortVal === 'date-asc') {
      list.sort((a, b) => (a.joinDate || '').localeCompare(b.joinDate || ''));
    }

    renderTable(list);
  }

  function renderTable(list) {
    if (!volunteerTableBody) return;

    const countBadge = document.getElementById('volunteerCountBadge');
    if (countBadge) {
      countBadge.textContent = `${list.length} Volunteer${list.length === 1 ? '' : 's'}`;
    }

    if (list.length === 0) {
      volunteerTableBody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state" style="border: none;">
              <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
              <h3 class="empty-state-title">No Volunteers Found</h3>
              <p class="empty-state-desc">Try modifying your search or filter criteria, or register a new volunteer mentor.</p>
              <button type="button" class="btn btn-primary btn-sm" onclick="window.DawnBloomVolunteers.openCreateModal()">
                Add Volunteer
              </button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const currentUser = window.DawnBloomAuth.getCurrentUser();
    const isAdmin = currentUser && (currentUser.role === 'Administrator' || currentUser.role === 'Admin');

    volunteerTableBody.innerHTML = list.map(v => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 34px; height: 34px; border-radius: 50%; background: var(--grad-primary); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.8rem; color: #fff; flex-shrink: 0;">
              ${(v.name || 'V').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div style="font-weight: 600; color: var(--text-primary);">${STORAGE.escapeHtml(v.name)}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${STORAGE.escapeHtml(v.email)}</div>
            </div>
          </div>
        </td>
        <td>
          <span style="font-size: 0.85rem; color: var(--text-secondary);">${STORAGE.escapeHtml(v.phone || '—')}</span>
        </td>
        <td>
          <div style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.85rem; color: var(--c-blush-pink);" title="${STORAGE.escapeHtml(v.skills)}">
            ${STORAGE.escapeHtml(v.skills || 'General Guidance')}
          </div>
        </td>
        <td>
          <span style="font-size: 0.82rem; color: var(--text-secondary);">${STORAGE.escapeHtml(v.availability || 'Flexible')}</span>
        </td>
        <td>
          <span style="font-size: 0.82rem; color: var(--text-muted);">${window.DawnBloom.formatDate(v.joinDate)}</span>
        </td>
        <td>
          <span class="badge ${v.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${STORAGE.escapeHtml(v.status)}</span>
        </td>
        <td>
          <div class="table-actions">
            <button type="button" class="btn btn-outline btn-sm" onclick="window.DawnBloomVolunteers.viewDetails('${v.id}')" title="View Details">
              View
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.DawnBloomVolunteers.openEditModal('${v.id}')" title="Edit Volunteer">
              Edit
            </button>
            ${isAdmin ? `
              <button type="button" class="btn btn-danger btn-sm" onclick="window.DawnBloomVolunteers.deleteVolunteer('${v.id}')" title="Delete Volunteer">
                Delete
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }

  function openFormModal(volunteer = null) {
    editingVolunteerId = volunteer ? volunteer.id : null;
    modalTitle.textContent = volunteer ? 'Edit Volunteer Profile' : 'Add New Volunteer Mentor';

    document.getElementById('volName').value = volunteer ? volunteer.name : '';
    document.getElementById('volEmail').value = volunteer ? volunteer.email : '';
    document.getElementById('volPhone').value = volunteer ? volunteer.phone : '';
    document.getElementById('volSkills').value = volunteer ? volunteer.skills : '';
    document.getElementById('volInterest').value = volunteer ? volunteer.interest : '';
    document.getElementById('volAvailability').value = volunteer ? volunteer.availability : 'Weekends (Morning)';
    document.getElementById('volPreferredDays').value = volunteer ? volunteer.preferredDays : '';
    document.getElementById('volJoinDate').value = volunteer ? volunteer.joinDate : new Date().toISOString().split('T')[0];
    document.getElementById('volStatus').value = volunteer ? volunteer.status : 'Active';
    document.getElementById('volNotes').value = volunteer ? (volunteer.notes || '') : '';

    modalOverlay.classList.add('open');
  }

  function closeFormModal() {
    modalOverlay.classList.remove('open');
    if (volunteerForm) volunteerForm.reset();
    editingVolunteerId = null;
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('volName').value.trim();
    const email = document.getElementById('volEmail').value.trim();
    const phone = document.getElementById('volPhone').value.trim();
    const skills = document.getElementById('volSkills').value.trim();
    const interest = document.getElementById('volInterest').value.trim();
    const availability = document.getElementById('volAvailability').value;
    const preferredDays = document.getElementById('volPreferredDays').value.trim();
    const joinDate = document.getElementById('volJoinDate').value;
    const status = document.getElementById('volStatus').value;
    const notes = document.getElementById('volNotes').value.trim();

    if (!name || !email) {
      window.DawnBloom.showToast('Please provide both volunteer name and email.', 'error');
      return;
    }

    // Check duplicate email
    const duplicate = currentVolunteers.find(v => 
      v.email.toLowerCase() === email.toLowerCase() && v.id !== editingVolunteerId
    );
    if (duplicate) {
      window.DawnBloom.showToast('A volunteer with this email already exists.', 'error');
      return;
    }

    const payload = {
      name,
      email,
      phone,
      skills,
      interest,
      availability,
      preferredDays,
      joinDate,
      status,
      notes
    };

    if (editingVolunteerId) {
      STORAGE.updateItem(KEYS.VOLUNTEERS, editingVolunteerId, payload);
      window.DawnBloom.showToast('Volunteer profile updated successfully.', 'success');
    } else {
      payload.id = STORAGE.generateId('VOL');
      STORAGE.addItem(KEYS.VOLUNTEERS, payload);
      window.DawnBloom.showToast('New volunteer mentor added successfully.', 'success');
    }

    closeFormModal();
    loadVolunteers();
  }

  function viewDetails(id) {
    const vol = currentVolunteers.find(v => v.id === id);
    if (!vol || !detailModalOverlay || !detailContent) return;

    // Fetch related history for this volunteer
    const allStudents = STORAGE.getCollection(KEYS.STUDENTS);
    const assignedStudents = allStudents.filter(s => 
      s.assignedVolunteerId === vol.id || 
      (s.assignedVolunteerName && s.assignedVolunteerName.toLowerCase() === vol.name.toLowerCase())
    );

    const allGuidance = STORAGE.getCollection(KEYS.GUIDANCE);
    const conductedSessions = allGuidance.filter(g => 
      g.volunteerId === vol.id || 
      (g.volunteerName && g.volunteerName.toLowerCase().includes(vol.name.toLowerCase()))
    );

    const allEvents = STORAGE.getCollection(KEYS.EVENTS);
    const participatedEvents = allEvents.filter(e => 
      (e.assignedVolunteers && e.assignedVolunteers.includes(vol.id)) || 
      (e.assignedVolunteerNames && e.assignedVolunteerNames.toLowerCase().includes(vol.name.toLowerCase()))
    );

    detailContent.innerHTML = `
      <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px;">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--grad-primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem; color: #fff;">
          ${(vol.name || 'V').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
        </div>
        <div style="flex: 1;">
          <h3 style="font-size: 1.25rem; font-weight: 700; color: #fff; margin: 0;">${STORAGE.escapeHtml(vol.name)}</h3>
          <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px; flex-wrap: wrap;">
            <span class="badge ${vol.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${STORAGE.escapeHtml(vol.status)}</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Joined ${window.DawnBloom.formatDate(vol.joinDate)}</span>
            <span style="font-size: 0.8rem; color: var(--c-blush-pink);">ID: ${STORAGE.escapeHtml(vol.id)}</span>
          </div>
        </div>
      </div>

      <!-- Volunteer Detail History Tabs -->
      <div class="tabs-nav" style="margin-bottom: 16px;">
        <button type="button" class="tab-btn active" id="tabVolOverview" onclick="window.DawnBloomVolunteers.switchDetailTab('overview')">
          👤 Profile & Contact
        </button>
        <button type="button" class="tab-btn" id="tabVolGuidance" onclick="window.DawnBloomVolunteers.switchDetailTab('guidance')">
          🎓 Mentees & Sessions (${conductedSessions.length})
        </button>
        <button type="button" class="tab-btn" id="tabVolEvents" onclick="window.DawnBloomVolunteers.switchDetailTab('events')">
          🎪 Events & Workshops (${participatedEvents.length})
        </button>
      </div>

      <!-- PANEL 1: Profile & Skills -->
      <div id="volPanelOverview">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; font-size: 0.88rem;">
          <div style="background: rgba(75, 61, 79, 0.2); padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Email Address</div>
            <div style="color: var(--text-primary); font-weight: 500;">${STORAGE.escapeHtml(vol.email)}</div>
          </div>
          <div style="background: rgba(75, 61, 79, 0.2); padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Phone Number</div>
            <div style="color: var(--text-primary); font-weight: 500;">${STORAGE.escapeHtml(vol.phone || 'Not provided')}</div>
          </div>
          <div style="background: rgba(75, 61, 79, 0.2); padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Availability</div>
            <div style="color: var(--c-blush-pink); font-weight: 500;">${STORAGE.escapeHtml(vol.availability || 'Flexible')}</div>
          </div>
          <div style="background: rgba(75, 61, 79, 0.2); padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Preferred Days</div>
            <div style="color: var(--text-primary); font-weight: 500;">${STORAGE.escapeHtml(vol.preferredDays || 'Any')}</div>
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <div style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Skills & Guidance Expertise</div>
          <div style="padding: 10px 14px; background: rgba(75, 61, 79, 0.25); border: 1px solid rgba(226, 194, 210, 0.15); border-radius: var(--radius-md); font-size: 0.88rem; color: #fff;">
            ${STORAGE.escapeHtml(vol.skills || 'General Mentorship')}
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <div style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Area of Mentorship Interest</div>
          <div style="font-size: 0.88rem; color: var(--text-secondary);">
            ${STORAGE.escapeHtml(vol.interest || 'Youth Development')}
          </div>
        </div>

        <div>
          <div style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Coordinator Notes</div>
          <p style="font-size: 0.88rem; color: var(--text-secondary); background: rgba(22, 25, 36, 0.6); padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin: 0; line-height: 1.45;">
            ${STORAGE.escapeHtml(vol.notes || 'No special notes recorded.')}
          </p>
        </div>
      </div>

      <!-- PANEL 2: Mentees & Guidance Sessions History -->
      <div id="volPanelGuidance" style="display: none;">
        <div style="margin-bottom: 12px;">
          <div style="font-size: 0.82rem; font-weight: 600; color: #fff; margin-bottom: 6px;">Currently Assigned Students (${assignedStudents.length})</div>
          ${assignedStudents.length === 0 ? `
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">No students assigned to this mentor currently.</p>
          ` : `
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${assignedStudents.map(s => `
                <div style="background: rgba(75, 61, 79, 0.35); border: 1px solid rgba(226, 194, 210, 0.2); border-radius: var(--radius-sm); padding: 6px 12px; font-size: 0.82rem;">
                  <strong style="color: #fff;">${STORAGE.escapeHtml(s.name)}</strong> (${STORAGE.escapeHtml(s.classLevel || 'General')})
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div style="font-size: 0.82rem; font-weight: 600; color: #fff; margin-bottom: 6px;">Guidance Sessions Conducted (${conductedSessions.length})</div>
        ${conductedSessions.length === 0 ? `
          <p style="font-size: 0.8rem; color: var(--text-muted);">No tutoring sessions recorded for this volunteer yet.</p>
        ` : `
          <div style="max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
            ${conductedSessions.map(cs => `
              <div style="background: rgba(22, 25, 36, 0.8); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 8px 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                  <span style="font-weight: 600; color: #fff; font-size: 0.88rem;">${STORAGE.escapeHtml(cs.title)}</span>
                  <span class="badge ${cs.status === 'Completed' ? 'badge-completed' : 'badge-scheduled'}" style="font-size: 0.68rem;">${cs.status}</span>
                </div>
                <div style="font-size: 0.76rem; color: var(--text-muted);">
                  📅 ${window.DawnBloom.formatDate(cs.date)} • Student: <strong>${STORAGE.escapeHtml(cs.studentName)}</strong> • Subject: ${STORAGE.escapeHtml(cs.subject)}
                </div>
                ${cs.notes ? `
                  <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 3px; font-style: italic;">
                    "${STORAGE.escapeHtml(cs.notes)}"
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- PANEL 3: Events & Contributions History -->
      <div id="volPanelEvents" style="display: none;">
        <div style="font-size: 0.82rem; font-weight: 600; color: #fff; margin-bottom: 8px;">Workshops & Community Events Led / Co-facilitated (${participatedEvents.length})</div>
        ${participatedEvents.length === 0 ? `
          <p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 16px;">This volunteer has not yet been assigned to community events.</p>
        ` : `
          <div style="max-height: 240px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
            ${participatedEvents.map(evt => `
              <div style="background: rgba(22, 25, 36, 0.8); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                  <span style="font-weight: 600; color: #fff; font-size: 0.9rem;">${STORAGE.escapeHtml(evt.name)}</span>
                  <span class="badge ${evt.status === 'Completed' ? 'badge-completed' : 'badge-scheduled'}" style="font-size: 0.7rem;">${evt.status}</span>
                </div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">
                  📅 ${window.DawnBloom.formatDate(evt.date)} • Category: <strong>${STORAGE.escapeHtml(evt.category)}</strong> • Venue: ${STORAGE.escapeHtml(evt.location || 'Main Hall')}
                </div>
                ${evt.outcome ? `
                  <div style="font-size: 0.8rem; color: var(--c-blush-pink); margin-top: 4px;">
                    ✓ Outcome: ${STORAGE.escapeHtml(evt.outcome)}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;

    detailModalOverlay.classList.add('open');
  }

  function switchDetailTab(tabKey) {
    const pOverview = document.getElementById('volPanelOverview');
    const pGuidance = document.getElementById('volPanelGuidance');
    const pEvents = document.getElementById('volPanelEvents');
    const tOverview = document.getElementById('tabVolOverview');
    const tGuidance = document.getElementById('tabVolGuidance');
    const tEvents = document.getElementById('tabVolEvents');

    if (tOverview) tOverview.classList.remove('active');
    if (tGuidance) tGuidance.classList.remove('active');
    if (tEvents) tEvents.classList.remove('active');

    if (pOverview) pOverview.style.display = 'none';
    if (pGuidance) pGuidance.style.display = 'none';
    if (pEvents) pEvents.style.display = 'none';

    if (tabKey === 'guidance') {
      if (pGuidance) pGuidance.style.display = 'block';
      if (tGuidance) tGuidance.classList.add('active');
    } else if (tabKey === 'events') {
      if (pEvents) pEvents.style.display = 'block';
      if (tEvents) tEvents.classList.add('active');
    } else {
      if (pOverview) pOverview.style.display = 'block';
      if (tOverview) tOverview.classList.add('active');
    }
  }

  function closeDetailModal() {
    if (detailModalOverlay) detailModalOverlay.classList.remove('open');
  }

  function openEditModal(id) {
    const vol = currentVolunteers.find(v => v.id === id);
    if (vol) openFormModal(vol);
  }

  function deleteVolunteer(id) {
    const vol = currentVolunteers.find(v => v.id === id);
    if (!vol) return;

    window.DawnBloom.confirm({
      title: 'Remove Volunteer',
      message: `Are you sure you want to remove volunteer "${vol.name}"? This action cannot be undone.`,
      confirmText: 'Remove Volunteer',
      cancelText: 'Cancel',
      isDanger: true
    }).then(confirmed => {
      if (confirmed) {
        STORAGE.deleteItem(KEYS.VOLUNTEERS, id);
        window.DawnBloom.showToast(`Volunteer ${vol.name} removed.`, 'info');
        loadVolunteers();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose methods for inline onclick handlers
  window.DawnBloomVolunteers = {
    openCreateModal: () => openFormModal(),
    openEditModal,
    viewDetails,
    switchDetailTab,
    deleteVolunteer
  };

})(window);
