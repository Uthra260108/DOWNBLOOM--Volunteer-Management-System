/**
 * DAWNBLOOM — Common UI Controller & Shared Layout Helpers
 * Handles sidebar toggling, toast notifications, custom confirmation dialogs,
 * header dates, notification feeds, active link highlighting, and UI utilities.
 */

(function (window) {
  'use strict';

  window.DawnBloom = window.DawnBloom || {};

  /**
   * Toast notification system
   */
  function showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('dbToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'dbToastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else if (type === 'warning') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    } else {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <span class="toast-text">${DawnBloomStorage.escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto dismiss
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  }

  /**
   * Accessible custom confirmation dialog (replaces native alert/confirm)
   */
  function confirmDialog({ title = 'Confirm Action', message = 'Are you sure you want to proceed?', confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false } = {}) {
    return new Promise((resolve) => {
      let modalOverlay = document.getElementById('dbConfirmModal');
      if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'dbConfirmModal';
        modalOverlay.className = 'modal-overlay';
        modalOverlay.innerHTML = `
          <div class="modal-container" style="max-width: 440px;">
            <div class="modal-header">
              <h3 class="modal-title" id="dbConfirmTitle">Confirm Action</h3>
              <button type="button" class="modal-close-btn" id="dbConfirmClose" aria-label="Close modal">&times;</button>
            </div>
            <div class="modal-body">
              <p id="dbConfirmMessage" style="color: var(--text-secondary); font-size: 0.95rem;"></p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline btn-sm" id="dbConfirmCancel">Cancel</button>
              <button type="button" class="btn btn-sm" id="dbConfirmOk">Confirm</button>
            </div>
          </div>
        `;
        document.body.appendChild(modalOverlay);
      }

      const titleEl = document.getElementById('dbConfirmTitle');
      const msgEl = document.getElementById('dbConfirmMessage');
      const okBtn = document.getElementById('dbConfirmOk');
      const cancelBtn = document.getElementById('dbConfirmCancel');
      const closeBtn = document.getElementById('dbConfirmClose');

      titleEl.textContent = title;
      msgEl.textContent = message;
      okBtn.textContent = confirmText;
      cancelBtn.textContent = cancelText;

      if (isDanger) {
        okBtn.className = 'btn btn-danger btn-sm';
      } else {
        okBtn.className = 'btn btn-primary btn-sm';
      }

      function cleanup(result) {
        modalOverlay.classList.remove('open');
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        closeBtn.removeEventListener('click', onCancel);
        modalOverlay.removeEventListener('click', onBackdrop);
        resolve(result);
      }

      function onOk() { cleanup(true); }
      function onCancel() { cleanup(false); }
      function onBackdrop(e) {
        if (e.target === modalOverlay) cleanup(false);
      }

      okBtn.addEventListener('click', onOk);
      cancelBtn.addEventListener('click', onCancel);
      closeBtn.addEventListener('click', onCancel);
      modalOverlay.addEventListener('click', onBackdrop);

      modalOverlay.classList.add('open');
      okBtn.focus();
    });
  }

  /**
   * Format human readable dates without timezone offset shifting
   */
  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      const str = String(dateStr).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const [y, m, d] = str.split('-').map(Number);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[m - 1]} ${d}, ${y}`;
      }
      const d = new Date(str);
      if (isNaN(d.getTime())) return str;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return String(dateStr || 'N/A');
    }
  }

  /**
   * Safely parse date for calendar badge chips
   */
  function parseDateBadge(dateStr) {
    if (!dateStr) return { month: 'DATE', day: '--' };
    const str = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split('-').map(Number);
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return { month: months[m - 1] || 'DATE', day: d };
    }
    const d = new Date(str);
    if (isNaN(d.getTime())) return { month: 'DATE', day: '--' };
    return {
      month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: d.getDate()
    };
  }

  /**
   * Format 24hr time to 12hr AM/PM
   */
  function formatTime(timeStr) {
    if (!timeStr) return '';
    try {
      const parts = timeStr.split(':');
      if (parts.length < 2) return timeStr;
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  }

  /**
   * Update header date display unconditionally
   */
  function updateHeaderDate() {
    const dateEl = document.getElementById('currentDateDisplay');
    if (dateEl) {
      const now = new Date();
      const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
      dateEl.textContent = now.toLocaleDateString('en-US', options);
    }
  }

  /**
   * Initialize Shared Application Layout
   */
  function initLayout() {
    // 1. Immediately set current date in header on all pages
    updateHeaderDate();

    // 2. Session check for authenticated pages
    const isAuthPage = window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('register.html');
    if (isAuthPage) return;

    const user = window.DawnBloomAuth.requireAuth();
    if (!user) return;

    const currentFile = window.location.pathname.split('/').pop() || 'dashboard.html';

    // Strict Role Guard:
    // If a Student accesses an administrative or staff page, redirect to student-dashboard.html
    if (user.role === 'Student' && currentFile !== 'student-dashboard.html') {
      window.location.replace('student-dashboard.html');
      return;
    }

    // If a Volunteer or Admin accesses student-dashboard.html, redirect back to dashboard.html
    if (user.role !== 'Student' && currentFile === 'student-dashboard.html') {
      window.location.replace('dashboard.html');
      return;
    }

    // 3. Populate user info in sidebar & header
    const sidebarName = document.getElementById('sidebarUserName');
    const sidebarRole = document.getElementById('sidebarUserRole');
    const sidebarAvatar = document.getElementById('sidebarUserAvatar');

    if (sidebarName) sidebarName.textContent = user.name;
    if (sidebarRole) sidebarRole.textContent = user.role;
    if (sidebarAvatar) {
      const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      sidebarAvatar.textContent = initials || 'DB';
    }

    // 4. Sidebar mobile toggle
    const toggleBtn = document.getElementById('mobileSidebarToggle');
    const sidebar = document.querySelector('.app-sidebar');
    let backdrop = document.querySelector('.sidebar-backdrop');

    if (!backdrop && sidebar) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
    }

    if (toggleBtn && sidebar && backdrop) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        backdrop.classList.toggle('open');
      });

      backdrop.addEventListener('click', () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('open');
      });
    }

    // 5. Highlight active link in sidebar
    const currentFile = window.location.pathname.split('/').pop() || 'dashboard.html';
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-item');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href === currentFile || (currentFile === '' && href === 'dashboard.html'))) {
        link.classList.add('active');
      } else if (!href || !href.startsWith('#')) {
        link.classList.remove('active');
      }

      // Handle anchor links on the same page (e.g. on student-dashboard)
      if (href && href.startsWith('#')) {
        link.addEventListener('click', (e) => {
          navLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
            if (sidebar && backdrop && sidebar.classList.contains('open')) {
              sidebar.classList.remove('open');
              backdrop.classList.remove('open');
            }
          }
        });
      }
    });

    // 6. Direct Logout Buttons (Header & Sidebar)
    const logoutSelectors = '#sidebarLogoutBtn, #headerLogoutBtn, .btn-logout, [data-action="logout"]';
    document.querySelectorAll(logoutSelectors).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.DawnBloom && window.DawnBloom.showToast) {
          window.DawnBloom.showToast('Signing out...', 'info');
        }
        setTimeout(() => {
          if (window.DawnBloomAuth && window.DawnBloomAuth.logout) {
            window.DawnBloomAuth.logout();
          } else {
            localStorage.removeItem('dawnbloom_session');
            sessionStorage.removeItem('dawnbloom_session');
            window.location.replace('login.html?logout=true');
          }
        }, 100);
      });
    });

    // 7. Notification dropdown toggle
    const notifBtn = document.getElementById('headerNotifBtn');
    const notifDropdown = document.getElementById('headerNotifDropdown');
    const notifList = document.getElementById('headerNotifList');

    if (notifBtn && notifDropdown) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = notifDropdown.classList.contains('open');
        if (!isOpen) {
          // Render recent activities
          const logs = DawnBloomStorage.getCollection(DawnBloomStorage.KEYS.ACTIVITY_LOG).slice(0, 6);
          if (notifList) {
            if (logs.length === 0) {
              notifList.innerHTML = `<li class="notification-item" style="text-align: center; color: var(--text-muted);">No recent notifications.</li>`;
            } else {
              notifList.innerHTML = logs.map(l => `
                <li class="notification-item">
                  <div style="font-weight: 500; color: var(--text-primary);">${DawnBloomStorage.escapeHtml(l.action)}: ${DawnBloomStorage.escapeHtml(l.details)}</div>
                  <div class="notification-item-time">${formatDate(l.timestamp)} · ${DawnBloomStorage.escapeHtml(l.user)}</div>
                </li>
              `).join('');
            }
          }
          notifDropdown.classList.add('open');
        } else {
          notifDropdown.classList.remove('open');
        }
      });

      document.addEventListener('click', (e) => {
        if (!notifDropdown.contains(e.target) && e.target !== notifBtn) {
          notifDropdown.classList.remove('open');
        }
      });
    }

    // Update notification badge count if unread indicator exists
    const notifBadge = document.getElementById('navTaskBadge');
    if (notifBadge) {
      const tasks = DawnBloomStorage.getCollection(DawnBloomStorage.KEYS.TASKS);
      const pendingCount = tasks.filter(t => t.status !== 'Completed').length;
      notifBadge.textContent = pendingCount;
    }
  }

  // Auto initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLayout);
  } else {
    initLayout();
  }

  // Export methods
  window.DawnBloom.showToast = showToast;
  window.DawnBloom.confirm = confirmDialog;
  window.DawnBloom.formatDate = formatDate;
  window.DawnBloom.formatTime = formatTime;
  window.DawnBloom.parseDateBadge = parseDateBadge;
  window.DawnBloom.updateHeaderDate = updateHeaderDate;

})(window);
