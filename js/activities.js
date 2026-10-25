/**
 * DAWNBLOOM — Activities & Programmes Controller
 * Full CRUD, search, category & status filtering, outcome recording,
 * cards grid view, and persistence.
 */

(function (window) {
  'use strict';

  const STORAGE = window.DawnBloomStorage;
  const KEYS = STORAGE.KEYS;

  let currentActivities = [];
  let currentVolunteers = [];
  let editingActivityId = null;

  // DOM Elements
  let activitiesGridContainer;
  let searchInput;
  let categoryFilter;
  let statusFilter;
  let modalOverlay;
  let activityForm;
  let modalTitle;
  let outcomeModalOverlay;
  let outcomeForm;
  let activeOutcomeActivityId = null;

  function init() {
    activitiesGridContainer = document.getElementById('activitiesGrid');
    searchInput = document.getElementById('searchActivity');
    categoryFilter = document.getElementById('filterActivityCategory');
    statusFilter = document.getElementById('filterActivityStatus');
    modalOverlay = document.getElementById('activityModal');
    activityForm = document.getElementById('activityForm');
    modalTitle = document.getElementById('activityModalTitle');
    outcomeModalOverlay = document.getElementById('outcomeModal');
    outcomeForm = document.getElementById('outcomeForm');

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);

    // Modal buttons
    const addBtn = document.getElementById('btnAddActivity');
    if (addBtn) addBtn.addEventListener('click', () => openFormModal());

    const cancelModalBtn = document.getElementById('btnCancelActivityModal');
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeFormModal);

    const closeModalBtn = document.getElementById('activityModalCloseBtn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeFormModal);

    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeFormModal();
      });
    }

    // Outcome modal buttons
    const closeOutcomeBtn = document.getElementById('outcomeModalCloseBtn');
    const cancelOutcomeBtn = document.getElementById('btnCancelOutcome');
    if (closeOutcomeBtn) closeOutcomeBtn.addEventListener('click', closeOutcomeModal);
    if (cancelOutcomeBtn) cancelOutcomeBtn.addEventListener('click', closeOutcomeModal);
    if (outcomeModalOverlay) {
      outcomeModalOverlay.addEventListener('click', (e) => {
        if (e.target === outcomeModalOverlay) closeOutcomeModal();
      });
    }

    if (activityForm) {
      activityForm.addEventListener('submit', handleFormSubmit);
    }

    if (outcomeForm) {
      outcomeForm.addEventListener('submit', handleOutcomeSubmit);
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      openFormModal();
    }

    loadData();
  }

  function loadData() {
    currentActivities = STORAGE.getCollection(KEYS.ACTIVITIES);
    currentVolunteers = STORAGE.getCollection(KEYS.VOLUNTEERS);
    applyFilters();
  }

  function applyFilters() {
    let list = [...currentActivities];

    // Search query
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    if (query) {
      list = list.filter(a =>
        (a.name || '').toLowerCase().includes(query) ||
        (a.category || '').toLowerCase().includes(query) ||
        (a.targetGroup || '').toLowerCase().includes(query) ||
        (a.outcome || '').toLowerCase().includes(query) ||
        (a.description || '').toLowerCase().includes(query)
      );
    }

    // Category filter
    const cat = categoryFilter ? categoryFilter.value : 'all';
    if (cat && cat !== 'all') {
      list = list.filter(a => a.category === cat);
    }

    // Status filter
    const status = statusFilter ? statusFilter.value : 'all';
    if (status && status !== 'all') {
      list = list.filter(a => a.status === status);
    }

    renderCards(list);
  }

  function renderCards(list) {
    if (!activitiesGridContainer) return;

    const countBadge = document.getElementById('activityCountBadge');
    if (countBadge) {
      countBadge.textContent = `${list.length} Programme${list.length === 1 ? '' : 's'}`;
    }

    if (list.length === 0) {
      activitiesGridContainer.innerHTML = `
        <div style="grid-column: 1 / -1;">
          <div class="empty-state">
            <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <h3 class="empty-state-title">No Activities Found</h3>
            <p class="empty-state-desc">Try clearing your filters or create a new student-support educational activity.</p>
            <button type="button" class="btn btn-primary btn-sm" onclick="window.DawnBloomActivities.openCreateModal()">
              Add Activity
            </button>
          </div>
        </div>
      `;
      return;
    }

    activitiesGridContainer.innerHTML = list.map(act => {
      let statusBadge = '<span class="badge badge-planned">Planned</span>';
      if (act.status === 'Ongoing') statusBadge = '<span class="badge badge-ongoing">Ongoing</span>';
      else if (act.status === 'Completed') statusBadge = '<span class="badge badge-completed">Completed</span>';

      return `
        <div class="item-card">
          <div>
            <div class="item-card-header">
              <div>
                <span class="badge badge-tag" style="margin-bottom: 6px;">${STORAGE.escapeHtml(act.category)}</span>
                <h3 class="item-card-title">${STORAGE.escapeHtml(act.name)}</h3>
              </div>
              ${statusBadge}
            </div>

            <p class="item-card-desc">${STORAGE.escapeHtml(act.description)}</p>

            <div class="item-card-meta">
              <div class="item-card-meta-row">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span style="color: #fff;">${window.DawnBloom.formatDate(act.date)}</span>
                <span>•</span>
                <span style="color: var(--c-blush-pink);">${STORAGE.escapeHtml(act.duration || '1 Hour')}</span>
              </div>

              <div class="item-card-meta-row">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                <span>Target: <strong>${STORAGE.escapeHtml(act.targetGroup || 'All Students')}</strong></span>
              </div>

              <div class="item-card-meta-row">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span>Volunteers: ${STORAGE.escapeHtml(act.volunteersInvolved || 'General Team')}</span>
              </div>
            </div>

            <!-- Recorded Outcome Box -->
            <div style="margin-top: 10px; padding: 10px 12px; background: rgba(75, 61, 79, 0.25); border: 1px solid rgba(226, 194, 210, 0.12); border-radius: var(--radius-md);">
              <div style="font-size: 0.72rem; color: var(--c-blush-pink); text-transform: uppercase; font-weight: 600; margin-bottom: 3px;">
                Recorded Outcome / Results:
              </div>
              <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4; margin: 0;">
                ${STORAGE.escapeHtml(act.outcome || 'No outcome recorded yet. Click "Record Outcome" below to add notes.')}
              </p>
            </div>
          </div>

          <div class="item-card-footer" style="margin-top: 16px;">
            <button type="button" class="btn btn-outline btn-sm" onclick="window.DawnBloomActivities.openOutcomeModal('${act.id}')">
              Record Outcome
            </button>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.DawnBloomActivities.openEditModal('${act.id}')">
                Edit
              </button>
              <button type="button" class="btn btn-danger btn-sm" onclick="window.DawnBloomActivities.deleteActivity('${act.id}')">
                Delete
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function openFormModal(act = null) {
    editingActivityId = act ? act.id : null;
    modalTitle.textContent = act ? 'Edit Programme / Activity' : 'Create Student Activity Programme';

    document.getElementById('actName').value = act ? act.name : '';
    document.getElementById('actCategory').value = act ? act.category : 'Literacy Development';
    document.getElementById('actDate').value = act ? act.date : new Date().toISOString().split('T')[0];
    document.getElementById('actDuration').value = act ? act.duration : '1 Hour / Weekly';
    document.getElementById('actTargetGroup').value = act ? act.targetGroup : 'Primary Students (Ages 7–11)';
    document.getElementById('actVolunteers').value = act ? act.volunteersInvolved : '';
    document.getElementById('actStatus').value = act ? act.status : 'Ongoing';
    document.getElementById('actDescription').value = act ? act.description : '';
    document.getElementById('actOutcome').value = act ? (act.outcome || '') : '';

    modalOverlay.classList.add('open');
  }

  function closeFormModal() {
    modalOverlay.classList.remove('open');
    if (activityForm) activityForm.reset();
    editingActivityId = null;
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('actName').value.trim();
    const category = document.getElementById('actCategory').value;
    const date = document.getElementById('actDate').value;
    const duration = document.getElementById('actDuration').value.trim();
    const targetGroup = document.getElementById('actTargetGroup').value.trim();
    const volunteersInvolved = document.getElementById('actVolunteers').value.trim();
    const status = document.getElementById('actStatus').value;
    const description = document.getElementById('actDescription').value.trim();
    const outcome = document.getElementById('actOutcome').value.trim();

    if (!name || !date) {
      window.DawnBloom.showToast('Please provide activity name and schedule date.', 'error');
      return;
    }

    const payload = {
      name,
      category,
      date,
      duration,
      targetGroup,
      volunteersInvolved,
      status,
      description,
      outcome
    };

    if (editingActivityId) {
      STORAGE.updateItem(KEYS.ACTIVITIES, editingActivityId, payload);
      window.DawnBloom.showToast('Activity programme updated.', 'success');
    } else {
      payload.id = STORAGE.generateId('ACT');
      STORAGE.addItem(KEYS.ACTIVITIES, payload);
      window.DawnBloom.showToast('New activity programme registered.', 'success');
    }

    closeFormModal();
    loadData();
  }

  function openOutcomeModal(id) {
    const act = currentActivities.find(a => a.id === id);
    if (!act || !outcomeModalOverlay) return;

    activeOutcomeActivityId = id;
    document.getElementById('outcomeActivityTitle').textContent = act.name;
    document.getElementById('outcomeStatus').value = act.status;
    document.getElementById('outcomeNotes').value = act.outcome || '';

    outcomeModalOverlay.classList.add('open');
  }

  function closeOutcomeModal() {
    if (outcomeModalOverlay) outcomeModalOverlay.classList.remove('open');
    activeOutcomeActivityId = null;
  }

  function handleOutcomeSubmit(e) {
    e.preventDefault();
    if (!activeOutcomeActivityId) return;

    const newStatus = document.getElementById('outcomeStatus').value;
    const newOutcome = document.getElementById('outcomeNotes').value.trim();

    STORAGE.updateItem(KEYS.ACTIVITIES, activeOutcomeActivityId, {
      status: newStatus,
      outcome: newOutcome
    });

    window.DawnBloom.showToast('Activity outcome recorded successfully.', 'success');
    closeOutcomeModal();
    loadData();
  }

  function openEditModal(id) {
    const act = currentActivities.find(a => a.id === id);
    if (act) openFormModal(act);
  }

  function deleteActivity(id) {
    const act = currentActivities.find(a => a.id === id);
    if (!act) return;

    window.DawnBloom.confirm({
      title: 'Delete Activity Programme',
      message: `Are you sure you want to remove the programme "${act.name}"?`,
      confirmText: 'Delete Activity',
      cancelText: 'Cancel',
      isDanger: true
    }).then(confirmed => {
      if (confirmed) {
        STORAGE.deleteItem(KEYS.ACTIVITIES, id);
        window.DawnBloom.showToast(`Activity "${act.name}" removed.`, 'info');
        loadData();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.DawnBloomActivities = {
    openCreateModal: () => openFormModal(),
    openEditModal,
    openOutcomeModal,
    deleteActivity
  };

})(window);
