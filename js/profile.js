/**
 * DAWNBLOOM — Profile & System Settings Controller
 * Handles user profile editing, password changes, notification preferences,
 * and the Reset Demonstration Data action.
 */

(function (window) {
  'use strict';

  const STORAGE = window.DawnBloomStorage;
  const KEYS = STORAGE.KEYS;

  function init() {
    loadProfile();

    const profileForm = document.getElementById('profileForm');
    if (profileForm) profileForm.addEventListener('submit', handleProfileUpdate);

    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) passwordForm.addEventListener('submit', handlePasswordChange);

    const prefsForm = document.getElementById('prefsForm');
    if (prefsForm) prefsForm.addEventListener('submit', handlePreferencesSave);

    const resetDataBtn = document.getElementById('btnResetDemoData');
    if (resetDataBtn) resetDataBtn.addEventListener('click', handleResetDemoData);

    const logoutBtn = document.getElementById('btnLogoutAction');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        window.DawnBloom.confirm({
          title: 'Sign Out',
          message: 'Are you sure you wish to sign out of DawnBloom?',
          confirmText: 'Sign Out',
          cancelText: 'Stay Logged In'
        }).then(confirmed => {
          if (confirmed) window.DawnBloomAuth.logout();
        });
      });
    }
  }

  function loadProfile() {
    const user = window.DawnBloomAuth.getCurrentUser();
    if (!user) return;

    const users = STORAGE.getCollection(KEYS.USERS);
    const fullUser = users.find(u => u.id === user.id) || user;

    // Display values
    document.getElementById('profileDisplayName').textContent = fullUser.name;
    document.getElementById('profileDisplayEmail').textContent = fullUser.email;
    document.getElementById('profileDisplayRole').textContent = fullUser.role || 'Volunteer';
    document.getElementById('profileInitials').textContent = fullUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('profileCreatedDate').textContent = window.DawnBloom.formatDate(fullUser.createdAt || '2026-08-01');

    // Form values
    document.getElementById('inputName').value = fullUser.name;
    document.getElementById('inputEmail').value = fullUser.email;
    document.getElementById('inputRole').value = fullUser.role || 'Volunteer';

    // Preferences
    const prefs = STORAGE.getCollection(KEYS.PREFERENCES) || {};
    const notifCheck = document.getElementById('prefEmailNotifications');
    const greetingSelect = document.getElementById('prefGreeting');

    if (notifCheck) notifCheck.checked = prefs.emailNotifications !== false;
    if (greetingSelect && prefs.greetingType) greetingSelect.value = prefs.greetingType;
  }

  function handleProfileUpdate(e) {
    e.preventDefault();

    const name = document.getElementById('inputName').value.trim();
    const email = document.getElementById('inputEmail').value.trim();

    if (!name || !email) {
      window.DawnBloom.showToast('Name and email cannot be blank.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      window.DawnBloom.showToast('Please provide a valid email format.', 'error');
      return;
    }

    const currentUser = window.DawnBloomAuth.getCurrentUser();
    const users = STORAGE.getCollection(KEYS.USERS);

    // Duplicate email check
    const duplicate = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== currentUser.id);
    if (duplicate) {
      window.DawnBloom.showToast('This email address is already registered to another account.', 'error');
      return;
    }

    // Update in users collection
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
      users[userIndex].name = name;
      users[userIndex].email = email;
      STORAGE.saveCollection(KEYS.USERS, users);
    }

    // Update session
    currentUser.name = name;
    currentUser.email = email;
    if (localStorage.getItem(KEYS.SESSION)) {
      localStorage.setItem(KEYS.SESSION, JSON.stringify(currentUser));
    } else {
      sessionStorage.setItem(KEYS.SESSION, JSON.stringify(currentUser));
    }

    STORAGE.logActivity('Profile Update', `Updated profile credentials for ${name}`, name);
    window.DawnBloom.showToast('Profile information saved successfully.', 'success');
    loadProfile();

    // Update sidebar UI immediately
    const sidebarName = document.getElementById('sidebarUserName');
    if (sidebarName) sidebarName.textContent = name;
  }

  function handlePasswordChange(e) {
    e.preventDefault();

    const currentPass = document.getElementById('inputCurrentPass').value;
    const newPass = document.getElementById('inputNewPass').value;
    const confirmPass = document.getElementById('inputConfirmPass').value;

    const currentUser = window.DawnBloomAuth.getCurrentUser();
    const users = STORAGE.getCollection(KEYS.USERS);
    const userRecord = users.find(u => u.id === currentUser.id);

    if (!userRecord || userRecord.password !== currentPass) {
      window.DawnBloom.showToast('Incorrect current demonstration password.', 'error');
      return;
    }

    if (!newPass || newPass.length < 6) {
      window.DawnBloom.showToast('New password must be at least 6 characters long.', 'error');
      return;
    }

    if (newPass !== confirmPass) {
      window.DawnBloom.showToast('New passwords do not match.', 'error');
      return;
    }

    userRecord.password = newPass;
    STORAGE.saveCollection(KEYS.USERS, users);
    STORAGE.logActivity('Password Changed', `Updated demonstration password for ${userRecord.email}`, userRecord.name);

    document.getElementById('passwordForm').reset();
    window.DawnBloom.showToast('Demonstration password updated successfully!', 'success');
  }

  function handlePreferencesSave(e) {
    e.preventDefault();

    const notifCheck = document.getElementById('prefEmailNotifications');
    const greetingSelect = document.getElementById('prefGreeting');

    const prefs = {
      emailNotifications: notifCheck ? notifCheck.checked : true,
      greetingType: greetingSelect ? greetingSelect.value : 'DawnBloom Family'
    };

    STORAGE.saveCollection(KEYS.PREFERENCES, prefs);
    window.DawnBloom.showToast('Preferences updated.', 'success');
  }

  function handleResetDemoData() {
    window.DawnBloom.confirm({
      title: 'Reset Demonstration Data',
      message: 'Are you sure you want to restore the demonstration database back to original sample records? All custom changes will be replaced with fresh sample data.',
      confirmText: 'Reset Demo Data',
      cancelText: 'Cancel',
      isDanger: true
    }).then(confirmed => {
      if (confirmed) {
        STORAGE.resetDemoData();
        window.DawnBloom.showToast('Demonstration data has been restored to default seed.', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
