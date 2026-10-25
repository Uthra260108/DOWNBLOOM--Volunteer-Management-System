/**
 * DAWNBLOOM — Task Management Controller
 * Handles task creation, editing, deletion, quick complete / reopen toggles,
 * priority badges, overdue checks, filtering, and sorting.
 */

(function (window) {
  'use strict';

  const STORAGE = window.DawnBloomStorage;
  const KEYS = STORAGE.KEYS;

  let currentTasks = [];
  let currentVolunteers = [];
  let currentStudents = [];
  let currentEvents = [];
  let editingTaskId = null;

  // DOM Elements
  let taskListContainer;
  let searchInput;
  let statusFilter;
  let priorityFilter;
  let volunteerFilter;
  let modalOverlay;
  let taskForm;
  let modalTitle;
  let assignedVolunteerSelect;
  let assignedStudentSelect;
  let relatedEventSelect;

  function init() {
    taskListContainer = document.getElementById('taskList');
    searchInput = document.getElementById('searchTask');
    statusFilter = document.getElementById('filterTaskStatus');
    priorityFilter = document.getElementById('filterTaskPriority');
    volunteerFilter = document.getElementById('filterTaskVolunteer');
    modalOverlay = document.getElementById('taskModal');
    taskForm = document.getElementById('taskForm');
    modalTitle = document.getElementById('taskModalTitle');
    assignedVolunteerSelect = document.getElementById('taskVolunteer');
    assignedStudentSelect = document.getElementById('taskStudent');
    relatedEventSelect = document.getElementById('taskEvent');

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    if (priorityFilter) priorityFilter.addEventListener('change', applyFilters);
    if (volunteerFilter) volunteerFilter.addEventListener('change', applyFilters);

    // Modal buttons
    const addBtn = document.getElementById('btnAddTask');
    if (addBtn) addBtn.addEventListener('click', () => openFormModal());

    const cancelModalBtn = document.getElementById('btnCancelTaskModal');
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeFormModal);

    const closeModalBtn = document.getElementById('taskModalCloseBtn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeFormModal);

    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeFormModal();
      });
    }

    if (taskForm) {
      taskForm.addEventListener('submit', handleFormSubmit);
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      openFormModal();
    }

    loadData();
  }

  function loadData() {
    currentTasks = STORAGE.getCollection(KEYS.TASKS);
    currentVolunteers = STORAGE.getCollection(KEYS.VOLUNTEERS);
    currentStudents = STORAGE.getCollection(KEYS.STUDENTS);
    currentEvents = STORAGE.getCollection(KEYS.EVENTS);

    populateDropdowns();
    updateProgressHeader();
    applyFilters();
  }

  function populateDropdowns() {
    const activeVols = currentVolunteers.filter(v => v.status === 'Active');

    if (assignedVolunteerSelect) {
      assignedVolunteerSelect.innerHTML = `
        <option value="">— Unassigned Volunteer —</option>
        ${activeVols.map(v => `<option value="${v.id}">${STORAGE.escapeHtml(v.name)}</option>`).join('')}
      `;
    }

    if (assignedStudentSelect) {
      assignedStudentSelect.innerHTML = `
        <option value="">— Internal Staff Task (No Student) —</option>
        ${currentStudents.map(s => `<option value="${s.id}">${STORAGE.escapeHtml(s.name)} (${s.id})</option>`).join('')}
      `;
    }

    if (volunteerFilter) {
      volunteerFilter.innerHTML = `
        <option value="all">All Volunteers</option>
        ${currentVolunteers.map(v => `<option value="${v.id}">${STORAGE.escapeHtml(v.name)}</option>`).join('')}
      `;
    }

    if (relatedEventSelect) {
      relatedEventSelect.innerHTML = `
        <option value="">— No Related Event (General) —</option>
        ${currentEvents.map(e => `<option value="${e.id}">${STORAGE.escapeHtml(e.name)}</option>`).join('')}
      `;
    }
  }

  function updateProgressHeader() {
    const total = currentTasks.length;
    const completed = currentTasks.filter(t => t.status === 'Completed').length;
    const inProgress = currentTasks.filter(t => t.status === 'In Progress').length;
    const todo = currentTasks.filter(t => t.status === 'To Do').length;

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const progRateEl = document.getElementById('taskOverviewPercent');
    const progBarEl = document.getElementById('taskOverviewProgressBar');
    const progTextEl = document.getElementById('taskOverviewRatio');

    if (progRateEl) progRateEl.textContent = `${rate}%`;
    if (progBarEl) progBarEl.style.width = `${rate}%`;
    if (progTextEl) progTextEl.textContent = `${completed} of ${total} tasks accomplished`;

    const todoEl = document.getElementById('countTodo');
    const inProgEl = document.getElementById('countInProgress');
    const doneEl = document.getElementById('countDone');

    if (todoEl) todoEl.textContent = todo;
    if (inProgEl) inProgEl.textContent = inProgress;
    if (doneEl) doneEl.textContent = completed;
  }

  function applyFilters() {
    let list = [...currentTasks];

    // Search query
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    if (query) {
      list = list.filter(t =>
        (t.title || '').toLowerCase().includes(query) ||
        (t.description || '').toLowerCase().includes(query) ||
        (t.assignedVolunteerName || '').toLowerCase().includes(query) ||
        (t.relatedEventName || '').toLowerCase().includes(query)
      );
    }

    // Status filter
    const status = statusFilter ? statusFilter.value : 'all';
    if (status && status !== 'all') {
      list = list.filter(t => t.status === status);
    }

    // Priority filter
    const priority = priorityFilter ? priorityFilter.value : 'all';
    if (priority && priority !== 'all') {
      list = list.filter(t => t.priority === priority);
    }

    // Volunteer filter
    const volId = volunteerFilter ? volunteerFilter.value : 'all';
    if (volId && volId !== 'all') {
      list = list.filter(t => t.assignedVolunteerId === volId);
    }

    // Sort by due date
    list.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

    renderList(list);
  }

  function renderList(list) {
    if (!taskListContainer) return;

    const countBadge = document.getElementById('taskCountBadge');
    if (countBadge) {
      countBadge.textContent = `${list.length} Task${list.length === 1 ? '' : 's'}`;
    }

    if (list.length === 0) {
      taskListContainer.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          <h3 class="empty-state-title">No Tasks Found</h3>
          <p class="empty-state-desc">All tasks match your filter, or you can add a new volunteer action item.</p>
          <button type="button" class="btn btn-primary btn-sm" onclick="window.DawnBloomTasks.openCreateModal()">
            Create Task
          </button>
        </div>
      `;
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    taskListContainer.innerHTML = list.map(t => {
      const isCompleted = t.status === 'Completed';
      const isOverdue = !isCompleted && t.dueDate && t.dueDate < todayStr;

      let priorityBadge = '<span class="badge badge-priority-medium">Medium</span>';
      if (t.priority === 'High') priorityBadge = '<span class="badge badge-priority-high">High Priority</span>';
      else if (t.priority === 'Low') priorityBadge = '<span class="badge badge-priority-low">Low</span>';

      let statusBadge = '<span class="badge badge-todo">To Do</span>';
      if (t.status === 'In Progress') statusBadge = '<span class="badge badge-in-progress">In Progress</span>';
      else if (isCompleted) statusBadge = '<span class="badge badge-completed">Completed</span>';

      return `
        <div class="item-card" style="margin-bottom: 12px; ${isCompleted ? 'opacity: 0.75;' : ''} ${isOverdue ? 'border-color: rgba(219, 107, 126, 0.45);' : ''}">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 14px;">
            <div style="display: flex; align-items: flex-start; gap: 12px; flex: 1;">
              <!-- Quick Complete Checkbox -->
              <button type="button" 
                onclick="window.DawnBloomTasks.toggleTaskStatus('${t.id}')"
                style="margin-top: 2px; width: 22px; height: 22px; border-radius: 6px; border: 1.5px solid ${isCompleted ? 'var(--state-success)' : 'var(--border-subtle)'}; background: ${isCompleted ? 'var(--state-success)' : 'var(--bg-input)'}; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;"
                title="${isCompleted ? 'Reopen task' : 'Mark task complete'}">
                ${isCompleted ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
              </button>

              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;">
                  <h4 style="font-size: 1.05rem; font-weight: 600; color: #fff; ${isCompleted ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">
                    ${STORAGE.escapeHtml(t.title)}
                  </h4>
                  ${priorityBadge}
                  ${statusBadge}
                  ${isOverdue ? '<span class="badge" style="background: rgba(219, 107, 126, 0.2); color: #FF8095;">Overdue</span>' : ''}
                </div>

                <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 8px; line-height: 1.4;">
                  ${STORAGE.escapeHtml(t.description || 'No detailed description.')}
                </p>

                <div style="display: flex; gap: 16px; flex-wrap: wrap; font-size: 0.8rem; color: var(--text-muted);">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <span>Mentor: <strong>${STORAGE.escapeHtml(t.assignedVolunteerName || 'Unassigned')}</strong></span>
                  </div>

                  ${t.studentName ? `
                    <div style="display: flex; align-items: center; gap: 6px; color: var(--c-blush-pink);">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                      <span>Student: <strong>${STORAGE.escapeHtml(t.studentName)}</strong></span>
                    </div>
                  ` : `
                    <span class="badge" style="background: rgba(134,128,146,0.15); color: var(--text-muted); font-size: 0.72rem; padding: 2px 6px;">Internal Staff Task</span>
                  `}

                  <div style="display: flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span style="${isOverdue ? 'color: var(--state-danger); font-weight: 600;' : ''}">Due: ${window.DawnBloom.formatDate(t.dueDate)}</span>
                  </div>

                  ${t.relatedEventName ? `
                    <div style="display: flex; align-items: center; gap: 6px; color: var(--text-muted);">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      <span>Event: ${STORAGE.escapeHtml(t.relatedEventName)}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>

            <!-- Task Actions -->
            <div style="display: flex; gap: 6px; flex-shrink: 0;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.DawnBloomTasks.openEditModal('${t.id}')">
                Edit
              </button>
              <button type="button" class="btn btn-danger btn-sm" onclick="window.DawnBloomTasks.deleteTask('${t.id}')">
                Delete
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function toggleTaskStatus(id) {
    const task = currentTasks.find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === 'Completed' ? 'To Do' : 'Completed';
    STORAGE.updateItem(KEYS.TASKS, id, { status: newStatus });
    window.DawnBloom.showToast(newStatus === 'Completed' ? 'Task marked as Completed!' : 'Task reopened.', 'success');
    loadData();
  }

  function openFormModal(task = null) {
    editingTaskId = task ? task.id : null;
    modalTitle.textContent = task ? 'Edit Task Details' : 'Create New Volunteer Task';
    populateDropdowns();

    document.getElementById('taskTitle').value = task ? task.title : '';
    document.getElementById('taskVolunteer').value = task ? (task.assignedVolunteerId || '') : '';
    const stuEl = document.getElementById('taskStudent');
    if (stuEl) stuEl.value = task ? (task.assignedStudentId || '') : '';
    document.getElementById('taskPriority').value = task ? task.priority : 'Medium';
    document.getElementById('taskStatus').value = task ? task.status : 'To Do';
    document.getElementById('taskDueDate').value = task ? task.dueDate : new Date().toISOString().split('T')[0];
    document.getElementById('taskEvent').value = task ? (task.relatedEventId || '') : '';
    document.getElementById('taskDescription').value = task ? task.description : '';

    modalOverlay.classList.add('open');
  }

  function closeFormModal() {
    modalOverlay.classList.remove('open');
    if (taskForm) taskForm.reset();
    editingTaskId = null;
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('taskTitle').value.trim();
    const volunteerId = document.getElementById('taskVolunteer').value;
    const studentEl = document.getElementById('taskStudent');
    const studentId = studentEl ? studentEl.value : '';
    const priority = document.getElementById('taskPriority').value;
    const status = document.getElementById('taskStatus').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const relatedEventId = document.getElementById('taskEvent').value;
    const description = document.getElementById('taskDescription').value.trim();

    if (!title || !dueDate) {
      window.DawnBloom.showToast('Please provide a task title and due date.', 'error');
      return;
    }

    const vol = currentVolunteers.find(v => v.id === volunteerId);
    const assignedVolunteerName = vol ? vol.name : 'Unassigned';

    const stu = currentStudents.find(s => s.id === studentId);
    const studentName = stu ? stu.name : '';

    const evt = currentEvents.find(e => e.id === relatedEventId);
    const relatedEventName = evt ? evt.name : '';

    const payload = {
      title,
      assignedVolunteerId: volunteerId,
      assignedVolunteerName,
      assignedStudentId: studentId || null,
      studentName: studentName || null,
      priority,
      status,
      dueDate,
      relatedEventId,
      relatedEventName,
      description
    };

    if (editingTaskId) {
      STORAGE.updateItem(KEYS.TASKS, editingTaskId, payload);
      window.DawnBloom.showToast('Task updated successfully.', 'success');
    } else {
      payload.id = STORAGE.generateId('TSK');
      STORAGE.addItem(KEYS.TASKS, payload);
      window.DawnBloom.showToast('New task added.', 'success');
    }

    closeFormModal();
    loadData();
  }

  function openEditModal(id) {
    const task = currentTasks.find(t => t.id === id);
    if (task) openFormModal(task);
  }

  function deleteTask(id) {
    const task = currentTasks.find(t => t.id === id);
    if (!task) return;

    window.DawnBloom.confirm({
      title: 'Delete Task',
      message: `Are you sure you want to remove the task "${task.title}"?`,
      confirmText: 'Delete Task',
      cancelText: 'Cancel',
      isDanger: true
    }).then(confirmed => {
      if (confirmed) {
        STORAGE.deleteItem(KEYS.TASKS, id);
        window.DawnBloom.showToast(`Task "${task.title}" deleted.`, 'info');
        loadData();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.DawnBloomTasks = {
    openCreateModal: () => openFormModal(),
    openEditModal,
    toggleTaskStatus,
    deleteTask
  };

})(window);
