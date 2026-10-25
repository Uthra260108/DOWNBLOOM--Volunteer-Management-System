/**
 * DAWNBLOOM — Authentication & Session Guard Module
 * Educational Demonstration: Browser localStorage authentication.
 * Supports 3 Roles: Administrator, Volunteer, and Student.
 * 
 * NOTE: Client-side authentication is strictly for local college demonstration
 * purposes and must NOT be used for real production sensitive data.
 */

(function (window) {
  'use strict';

  const STORAGE = window.DawnBloomStorage;
  const KEYS = STORAGE ? STORAGE.KEYS : {
    USERS: 'dawnbloom_users',
    SESSION: 'dawnbloom_session',
    STUDENTS: 'dawnbloom_students',
    ACTIVITY_LOG: 'dawnbloom_activity_log'
  };

  /**
   * Get currently active session
   */
  function getCurrentUser() {
    try {
      let sessionData = null;
      if (STORAGE && STORAGE.safeStorageGet) {
        sessionData = STORAGE.safeStorageGet(KEYS.SESSION);
      }
      if (!sessionData) {
        sessionData = localStorage.getItem(KEYS.SESSION) || sessionStorage.getItem(KEYS.SESSION);
      }
      if (!sessionData) return null;
      return JSON.parse(sessionData);
    } catch (e) {
      console.warn('[DawnBloom Auth] Corrupted session token:', e);
      return null;
    }
  }

  /**
   * Guard for protected dashboard pages
   * Call at the top of protected pages: if no session, redirects to login.html
   */
  function requireAuth(allowedRoles) {
    const user = getCurrentUser();
    if (!user) {
      const currentPath = window.location.pathname;
      const targetPage = encodeURIComponent(currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'dashboard.html');
      window.location.replace(`login.html?redirect=${targetPage}`);
      return null;
    }

    const currentFile = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1) || 'dashboard.html';

    // Strict Role Access Control:
    // 1. Students can ONLY access student-dashboard.html
    if (user.role === 'Student' && currentFile !== 'student-dashboard.html') {
      window.location.replace('student-dashboard.html');
      return null;
    }

    // 2. Volunteers and Admins CANNOT access student-dashboard.html
    if (user.role !== 'Student' && currentFile === 'student-dashboard.html') {
      window.location.replace('dashboard.html');
      return null;
    }

    // Role check if specific roles are required
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = (user.role || '').toLowerCase();
      const isAllowed = allowedRoles.some(r => {
        const ar = r.toLowerCase();
        return ar === userRole || (ar === 'admin' && (userRole === 'administrator' || userRole === 'admin'));
      });

      if (!isAllowed) {
        if (user.role === 'Student') {
          window.location.replace('student-dashboard.html');
        } else {
          window.location.replace('dashboard.html');
        }
        return null;
      }
    }

    return user;
  }

  /**
   * Guard for guest pages (login.html, register.html)
   * If already logged in, redirects to the appropriate dashboard
   */
  function requireGuest() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('logout') === 'true' || urlParams.get('switch') === 'true') {
      if (STORAGE && STORAGE.safeStorageRemove) {
        STORAGE.safeStorageRemove(KEYS.SESSION);
      }
      try {
        localStorage.removeItem(KEYS.SESSION);
        sessionStorage.removeItem(KEYS.SESSION);
      } catch (e) {}
      return true;
    }

    const user = getCurrentUser();
    if (user) {
      if (user.role === 'Student') {
        window.location.replace('student-dashboard.html');
      } else {
        window.location.replace('dashboard.html');
      }
      return false;
    }
    return true;
  }

  /**
   * Authenticate user with Email or Student ID and password
   * Seamlessly resolves user role and redirects to the correct portal
   */
  function login(identifier, password, rememberMe = true, expectedRole = null) {
    if (!identifier || !password) {
      return { success: false, message: 'Please provide both your login ID/email and password.' };
    }

    const cleanInput = identifier.trim().toLowerCase();
    const users = STORAGE.getCollection(KEYS.USERS);

    // Match by email OR studentId
    const matchedUser = users.find(u =>
      (u.email && u.email.toLowerCase() === cleanInput) ||
      (u.studentId && u.studentId.toLowerCase() === cleanInput)
    );

    if (!matchedUser) {
      if (cleanInput.startsWith('stu-') || (expectedRole && expectedRole.toLowerCase() === 'student')) {
        return {
          success: false,
          message: `Student ID "${identifier}" was not found. Please click the Student demo chip (STU-101) or register a new student account.`
        };
      }
      return {
        success: false,
        message: 'Account not found with this email address or Student ID.'
      };
    }

    if (matchedUser.password !== password) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    // Prepare session payload
    const actualRole = matchedUser.role || 'Volunteer';
    const sessionPayload = {
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email || `${matchedUser.studentId}@student.dawnbloom.org`,
      role: actualRole,
      studentId: matchedUser.studentId || null,
      volunteerId: matchedUser.volunteerId || null,
      loginTime: new Date().toISOString(),
      rememberMe: Boolean(rememberMe)
    };

    // Resilient session saving across normal & private browsing modes
    if (STORAGE && STORAGE.safeStorageSet) {
      STORAGE.safeStorageSet(KEYS.SESSION, JSON.stringify(sessionPayload));
    }
    try {
      if (rememberMe) {
        localStorage.setItem(KEYS.SESSION, JSON.stringify(sessionPayload));
        sessionStorage.removeItem(KEYS.SESSION);
      } else {
        sessionStorage.setItem(KEYS.SESSION, JSON.stringify(sessionPayload));
        localStorage.removeItem(KEYS.SESSION);
      }
    } catch (e) {
      // In private browsing mode where quota/security throws
    }

    STORAGE.logActivity('Login', `User signed in: ${matchedUser.studentId || matchedUser.email} (${actualRole})`, matchedUser.name);

    const redirectUrl = actualRole === 'Student' ? 'student-dashboard.html' : 'dashboard.html';

    return {
      success: true,
      user: sessionPayload,
      redirectUrl: redirectUrl,
      message: `Welcome back, ${matchedUser.name}!`
    };
  }

  /**
   * Register a new Volunteer or Administrator demo account
   */
  function register({ name, email, password, confirmPassword, role = 'Volunteer' }) {
    if (!name || !name.trim()) {
      return { success: false, message: 'Please enter your full name.' };
    }

    if (!email || !email.trim()) {
      return { success: false, message: 'Please enter your email address.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { success: false, message: 'Please provide a valid email format (e.g. name@domain.com).' };
    }

    if (!password || password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters in length.' };
    }

    if (password !== confirmPassword) {
      return { success: false, message: 'Passwords do not match. Please re-enter.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = STORAGE.getCollection(KEYS.USERS);

    if (users.some(u => u.email && u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'An account with this email address already exists.' };
    }

    const newUser = {
      id: STORAGE.generateId('USR'),
      name: name.trim(),
      email: cleanEmail,
      password: password,
      role: role || 'Volunteer',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    STORAGE.saveCollection(KEYS.USERS, users);
    STORAGE.logActivity('Register', `New user account created: ${newUser.email}`, newUser.name);

    return {
      success: true,
      user: newUser,
      redirectUrl: 'dashboard.html',
      message: 'Account successfully registered! You can now log in.'
    };
  }

  /**
   * Register a new Student demo account
   */
  function registerStudent({ name, studentId, classLevel = 'Grade 6', subjects = 'General Guidance', password, confirmPassword }) {
    if (!name || !name.trim()) {
      return { success: false, message: 'Please enter the student\'s full name.' };
    }

    if (!studentId || !studentId.trim()) {
      return { success: false, message: 'Please enter a Student ID (e.g. STU-106).' };
    }

    const cleanStudentId = studentId.trim().toUpperCase();
    if (cleanStudentId.length < 3) {
      return { success: false, message: 'Student ID must be at least 3 characters long.' };
    }

    if (!password || password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters in length.' };
    }

    if (password !== confirmPassword) {
      return { success: false, message: 'Passwords do not match. Please re-enter.' };
    }

    const users = STORAGE.getCollection(KEYS.USERS);
    if (users.some(u => (u.studentId && u.studentId.toUpperCase() === cleanStudentId) || (u.email && u.email.toLowerCase() === `${cleanStudentId.toLowerCase()}@student.dawnbloom.org`))) {
      return { success: false, message: `A student account with ID "${cleanStudentId}" already exists.` };
    }

    const newUser = {
      id: STORAGE.generateId('USR'),
      name: name.trim(),
      studentId: cleanStudentId,
      email: `${cleanStudentId.toLowerCase()}@student.dawnbloom.org`,
      password: password,
      role: 'Student',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    STORAGE.saveCollection(KEYS.USERS, users);

    // Also check if a record exists in dawnbloom_students; if not, add it so it appears in the system
    const students = STORAGE.getCollection(STORAGE.KEYS.STUDENTS);
    let existingStudent = students.find(s => s.id && s.id.toUpperCase() === cleanStudentId);
    if (!existingStudent) {
      const newStudentProfile = {
        id: cleanStudentId,
        name: newUser.name,
        ageGroup: '11–13 Years',
        classLevel: classLevel.trim() || 'Grade 6',
        subjects: subjects.trim() || 'General Guidance',
        guidanceNeeds: 'Self-registered student seeking guidance and mentorship.',
        assignedVolunteerId: 'VOL-001',
        assignedVolunteerName: 'Sarah Jenkins',
        enrollmentDate: new Date().toISOString().split('T')[0],
        status: 'Active'
      };
      students.unshift(newStudentProfile);
      STORAGE.saveCollection(STORAGE.KEYS.STUDENTS, students);
    }

    STORAGE.logActivity('Register', `New student account created: ${cleanStudentId}`, newUser.name);

    return {
      success: true,
      user: newUser,
      redirectUrl: 'student-dashboard.html',
      message: 'Student account registered successfully!'
    };
  }

  /**
   * End current session and redirect to login
   */
  function logout() {
    const user = getCurrentUser();
    if (user) {
      STORAGE.logActivity('Logout', `User signed out: ${user.studentId || user.email}`, user.name);
    }
    if (STORAGE && STORAGE.safeStorageRemove) {
      STORAGE.safeStorageRemove(KEYS.SESSION);
    }
    try {
      localStorage.removeItem(KEYS.SESSION);
      sessionStorage.removeItem(KEYS.SESSION);
    } catch (e) {}
    window.location.replace('login.html?logout=true');
  }

  /**
   * Toggle password input visibility helper
   */
  function setupPasswordToggle(inputEl, toggleBtnEl) {
    if (!inputEl || !toggleBtnEl) return;
    toggleBtnEl.addEventListener('click', () => {
      const isPassword = inputEl.getAttribute('type') === 'password';
      inputEl.setAttribute('type', isPassword ? 'text' : 'password');
      toggleBtnEl.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      toggleBtnEl.innerHTML = isPassword
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    });
  }

  /**
   * Fast 1-Click Login for Demonstration & Testing
   */
  function quickLogin(role) {
    const roleLower = String(role || '').toLowerCase();
    if (roleLower === 'student') {
      return login('STU-101', 'student123', true, 'Student');
    } else if (roleLower === 'volunteer') {
      return login('volunteer@dawnbloom.org', 'volunteer123', true, 'Volunteer');
    } else {
      return login('admin@dawnbloom.org', 'admin123', true, 'Administrator');
    }
  }

  // Expose to window.DawnBloomAuth
  window.DawnBloomAuth = {
    getCurrentUser,
    requireAuth,
    requireGuest,
    login,
    quickLogin,
    register,
    registerStudent,
    logout,
    setupPasswordToggle
  };

})(window);
