/**
 * DAWNBLOOM — Student Guidance Management Controller
 * Full CRUD, search, filter by education level & support status,
 * volunteer assignment dropdown, detail modal, and persistence.
 */

(function (window) {
  'use strict';

  const STORAGE = window.DawnBloomStorage;
  const KEYS = STORAGE.KEYS;

  let currentStudents = [];
  let currentVolunteers = [];
  let editingStudentId = null;

  // DOM Elements
  let studentTableBody;
  let searchInput;
  let statusFilter;
  let classFilter;
  let modalOverlay;
  let studentForm;
  let modalTitle;
  let detailModalOverlay;
  let detailContent;
  let assignedVolunteerSelect;

  function init() {
    studentTableBody = document.getElementById('studentTableBody');
    searchInput = document.getElementById('searchStudent');
    statusFilter = document.getElementById('filterStudentStatus');
    classFilter = document.getElementById('filterClassLevel');
    modalOverlay = document.getElementById('studentModal');
    studentForm = document.getElementById('studentForm');
    modalTitle = document.getElementById('studentModalTitle');
    detailModalOverlay = document.getElementById('studentDetailModal');
    detailContent = document.getElementById('studentDetailContent');
    assignedVolunteerSelect = document.getElementById('stuAssignedVolunteer');

    // Event listeners
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    if (classFilter) classFilter.addEventListener('change', applyFilters);

    // Modal buttons
    const addBtn = document.getElementById('btnAddStudent');
    if (addBtn) addBtn.addEventListener('click', () => openFormModal());

    const cancelModalBtn = document.getElementById('btnCancelStudentModal');
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeFormModal);

    const closeModalBtn = document.getElementById('studentModalCloseBtn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeFormModal);

    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeFormModal();
      });
    }

    // Detail modal close
    const closeDetailBtn = document.getElementById('studentDetailCloseBtn');
    const closeDetailFooterBtn = document.getElementById('btnStudentDetailClose');
    if (closeDetailBtn) closeDetailBtn.addEventListener('click', closeDetailModal);
    if (closeDetailFooterBtn) closeDetailFooterBtn.addEventListener('click', closeDetailModal);
    if (detailModalOverlay) {
      detailModalOverlay.addEventListener('click', (e) => {
        if (e.target === detailModalOverlay) closeDetailModal();
      });
    }

    if (studentForm) {
      studentForm.addEventListener('submit', handleFormSubmit);
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      openFormModal();
    }

    loadData();
  }

  function loadData() {
    currentStudents = STORAGE.getCollection(KEYS.STUDENTS);
    currentVolunteers = STORAGE.getCollection(KEYS.VOLUNTEERS);
    populateVolunteerOptions();
    checkVolunteerRoleUI();
    applyFilters();
  }

  function checkVolunteerRoleUI() {
    const user = window.DawnBloomAuth.getCurrentUser();
    const volunteerNotice = document.getElementById('volunteerNoticeBanner');
    const addBtn = document.getElementById('btnAddStudent');

    if (user && user.role === 'Volunteer') {
      if (addBtn) addBtn.style.display = 'none';
      if (volunteerNotice) {
        volunteerNotice.style.display = 'flex';
        volunteerNotice.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
          <span><strong>Volunteer View:</strong> You are viewing only students assigned to you (${STORAGE.escapeHtml(user.name)}).</span>
        `;
      }
    } else {
      if (addBtn) addBtn.style.display = 'inline-flex';
      if (volunteerNotice) volunteerNotice.style.display = 'none';
    }
  }

  function populateVolunteerOptions() {
    if (!assignedVolunteerSelect) return;
    const activeVolunteers = currentVolunteers.filter(v => v.status === 'Active');
    
    assignedVolunteerSelect.innerHTML = `
      <option value="">— Unassigned / Pending Assignment —</option>
      ${activeVolunteers.map(v => `
        <option value="${v.id}">${STORAGE.escapeHtml(v.name)} (${STORAGE.escapeHtml(v.skills.substring(0, 24))}...)</option>
      `).join('')}
    `;
  }

  function applyFilters() {
    let list = [...currentStudents];
    const user = window.DawnBloomAuth.getCurrentUser();

    // If logged in as Volunteer, only show students assigned to this volunteer
    if (user && user.role === 'Volunteer') {
      const volId = user.volunteerId || (currentVolunteers.find(v => v.email && user.email && v.email.toLowerCase() === user.email.toLowerCase()) || {}).id;
      list = list.filter(s => 
        (volId && s.assignedVolunteerId === volId) ||
        (s.assignedVolunteerName && s.assignedVolunteerName.toLowerCase().includes(user.name.toLowerCase()))
      );
    }

    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    if (query) {
      list = list.filter(s =>
        (s.name || '').toLowerCase().includes(query) ||
        (s.subjects || '').toLowerCase().includes(query) ||
        (s.assignedVolunteerName || '').toLowerCase().includes(query)
      );
    }

    const status = statusFilter ? statusFilter.value : 'all';
    if (status && status !== 'all') {
      list = list.filter(s => s.status === status);
    }

    const level = classFilter ? classFilter.value : 'all';
    if (level && level !== 'all') {
      list = list.filter(s => (s.classLevel || '').toLowerCase().includes(level.toLowerCase()));
    }

    renderTable(list);
  }

  function renderTable(list) {
    if (!studentTableBody) return;

    const countBadge = document.getElementById('studentCountBadge');
    if (countBadge) {
      countBadge.textContent = `${list.length} Student${list.length === 1 ? '' : 's'}`;
    }

    if (list.length === 0) {
      studentTableBody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state" style="border: none;">
              <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
              <h3 class="empty-state-title">No Students Found</h3>
              <p class="empty-state-desc">Try clearing your filters or enroll a student for guidance support.</p>
              <button type="button" class="btn btn-primary btn-sm" onclick="window.DawnBloomStudents.openCreateModal()">
                Add Student
              </button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const currentUser = window.DawnBloomAuth.getCurrentUser();
    const isAdmin = currentUser && (currentUser.role === 'Administrator' || currentUser.role === 'Admin');

    studentTableBody.innerHTML = list.map(s => {
      const vol = currentVolunteers.find(v => v.id === s.assignedVolunteerId);
      const volunteerName = vol ? vol.name : (s.assignedVolunteerName || 'Unassigned');

      let statusBadge = '<span class="badge badge-active">Active</span>';
      if (s.status === 'On Hold') {
        statusBadge = '<span class="badge badge-in-progress">On Hold</span>';
      } else if (s.status === 'Completed') {
        statusBadge = '<span class="badge badge-completed">Completed</span>';
      }

      return `
        <tr>
          <td>
            <div style="font-weight: 600; color: #fff;">${STORAGE.escapeHtml(s.name)}</div>
            <div style="font-size: 0.76rem; color: var(--text-muted);">${STORAGE.escapeHtml(s.id)}</div>
          </td>
          <td>
            <div style="font-size: 0.88rem; color: var(--text-secondary);">${STORAGE.escapeHtml(s.classLevel || 'General')}</div>
            <div style="font-size: 0.76rem; color: var(--c-blush-pink);">${STORAGE.escapeHtml(s.ageGroup || 'N/A')}</div>
          </td>
          <td>
            <div style="max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.85rem; color: var(--text-primary);" title="${STORAGE.escapeHtml(s.subjects)}">
              ${STORAGE.escapeHtml(s.subjects || 'General Tutoring')}
            </div>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${vol ? 'var(--state-success)' : 'var(--c-lavender-grey)'};"></span>
              <span style="font-size: 0.86rem; color: ${vol ? '#fff' : 'var(--text-muted)'}; font-weight: ${vol ? '500' : 'normal'};">
                ${STORAGE.escapeHtml(volunteerName)}
              </span>
            </div>
          </td>
          <td>${statusBadge}</td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn btn-outline btn-sm" onclick="window.DawnBloomStudents.viewDetails('${s.id}')" title="View Profile">
                View
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.DawnBloomStudents.openEditModal('${s.id}')" title="Edit Student">
                Edit
              </button>
              ${isAdmin ? `
                <button type="button" class="btn btn-danger btn-sm" onclick="window.DawnBloomStudents.deleteStudent('${s.id}')" title="Delete Record">
                  Delete
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function openFormModal(student = null) {
    editingStudentId = student ? student.id : null;
    modalTitle.textContent = student ? 'Edit Student Guidance Record' : 'Enroll Student for Guidance Support';
    populateVolunteerOptions();

    document.getElementById('stuName').value = student ? student.name : '';
    document.getElementById('stuAgeGroup').value = student ? student.ageGroup : '10–12 Years';
    document.getElementById('stuClassLevel').value = student ? student.classLevel : 'Grade 6';
    document.getElementById('stuSubjects').value = student ? student.subjects : '';
    document.getElementById('stuGuidanceNeeds').value = student ? student.guidanceNeeds : '';
    document.getElementById('stuEnrollmentDate').value = student ? student.enrollmentDate : new Date().toISOString().split('T')[0];
    document.getElementById('stuStatus').value = student ? student.status : 'Active';
    assignedVolunteerSelect.value = student ? (student.assignedVolunteerId || '') : '';

    modalOverlay.classList.add('open');
  }

  function closeFormModal() {
    modalOverlay.classList.remove('open');
    if (studentForm) studentForm.reset();
    editingStudentId = null;
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('stuName').value.trim();
    const ageGroup = document.getElementById('stuAgeGroup').value;
    const classLevel = document.getElementById('stuClassLevel').value.trim();
    const subjects = document.getElementById('stuSubjects').value.trim();
    const guidanceNeeds = document.getElementById('stuGuidanceNeeds').value.trim();
    const enrollmentDate = document.getElementById('stuEnrollmentDate').value;
    const status = document.getElementById('stuStatus').value;
    const assignedVolunteerId = assignedVolunteerSelect.value;

    if (!name) {
      window.DawnBloom.showToast('Please provide student display name.', 'error');
      return;
    }

    let assignedVolunteerName = 'Unassigned';
    if (assignedVolunteerId) {
      const vol = currentVolunteers.find(v => v.id === assignedVolunteerId);
      if (vol) assignedVolunteerName = vol.name;
    }

    const payload = {
      name,
      ageGroup,
      classLevel,
      subjects,
      guidanceNeeds,
      enrollmentDate,
      status,
      assignedVolunteerId,
      assignedVolunteerName
    };

    if (editingStudentId) {
      STORAGE.updateItem(KEYS.STUDENTS, editingStudentId, payload);
      window.DawnBloom.showToast('Student guidance record updated.', 'success');
    } else {
      payload.id = STORAGE.generateId('STU');
      STORAGE.addItem(KEYS.STUDENTS, payload);
      window.DawnBloom.showToast('Student enrolled for guidance successfully.', 'success');
    }

    closeFormModal();
    loadData();
  }

  function viewDetails(id) {
    const s = currentStudents.find(item => item.id === id);
    if (!s || !detailModalOverlay || !detailContent) return;

    const vol = currentVolunteers.find(v => v.id === s.assignedVolunteerId);
    const volunteerName = vol ? vol.name : (s.assignedVolunteerName || 'None assigned yet');

    detailContent.innerHTML = `
      <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 20px;">
        <div style="width: 52px; height: 52px; border-radius: var(--radius-md); background: rgba(226, 194, 210, 0.2); border: 1px solid rgba(226, 194, 210, 0.3); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; color: #fff;">
          ${s.name.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: #fff;">${STORAGE.escapeHtml(s.name)}</h3>
          <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px;">
            <span class="badge ${s.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${STORAGE.escapeHtml(s.status)}</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${STORAGE.escapeHtml(s.classLevel)} • ${STORAGE.escapeHtml(s.ageGroup)}</span>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; font-size: 0.9rem;">
        <div>
          <div style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase;">Enrollment Date</div>
          <div style="color: var(--text-primary); font-weight: 500;">${window.DawnBloom.formatDate(s.enrollmentDate)}</div>
        </div>
        <div>
          <div style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase;">Assigned Mentor</div>
          <div style="color: var(--c-blush-pink); font-weight: 600;">${STORAGE.escapeHtml(volunteerName)}</div>
        </div>
      </div>

      <div style="margin-bottom: 14px;">
        <div style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Subjects Needing Educational Support</div>
        <div style="padding: 10px 14px; background: rgba(75, 61, 79, 0.25); border: 1px solid rgba(226, 194, 210, 0.15); border-radius: var(--radius-md); font-size: 0.88rem; color: #fff;">
          ${STORAGE.escapeHtml(s.subjects || 'General Tutoring')}
        </div>
      </div>

      <div>
        <div style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Guidance Requirements & Mentor Notes</div>
        <p style="font-size: 0.88rem; color: var(--text-secondary); background: rgba(22, 25, 36, 0.6); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); line-height: 1.5;">
          ${STORAGE.escapeHtml(s.guidanceNeeds || 'No specific guidance requirements noted.')}
        </p>
      </div>
    `;

    detailModalOverlay.classList.add('open');
  }

  function closeDetailModal() {
    if (detailModalOverlay) detailModalOverlay.classList.remove('open');
  }

  function openEditModal(id) {
    const s = currentStudents.find(item => item.id === id);
    if (s) openFormModal(s);
  }

  function deleteStudent(id) {
    const s = currentStudents.find(item => item.id === id);
    if (!s) return;

    window.DawnBloom.confirm({
      title: 'Remove Student Record',
      message: `Are you sure you want to remove the guidance record for "${s.name}"? This action cannot be undone.`,
      confirmText: 'Remove Record',
      cancelText: 'Cancel',
      isDanger: true
    }).then(confirmed => {
      if (confirmed) {
        STORAGE.deleteItem(KEYS.STUDENTS, id);
        window.DawnBloom.showToast(`Record for ${s.name} removed.`, 'info');
        loadData();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.DawnBloomStudents = {
    openCreateModal: () => openFormModal(),
    openEditModal,
    viewDetails,
    deleteStudent
  };

})(window);
