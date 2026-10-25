/**
 * DAWNBLOOM — Storage Architecture & Data Access Module
 * Pure localStorage, JSON serialization, graceful error handling,
 * initial demo data seeding, and audit activity logging.
 */

(function (window) {
  'use strict';

  // Storage Keys
  const KEYS = {
    USERS: 'dawnbloom_users',
    SESSION: 'dawnbloom_session',
    VOLUNTEERS: 'dawnbloom_volunteers',
    STUDENTS: 'dawnbloom_students',
    GUIDANCE: 'dawnbloom_guidance',
    EVENTS: 'dawnbloom_events',
    TASKS: 'dawnbloom_tasks',
    ACTIVITIES: 'dawnbloom_activities',
    PREFERENCES: 'dawnbloom_preferences',
    ACTIVITY_LOG: 'dawnbloom_activity_log'
  };

  /**
   * Escape HTML to prevent XSS during DOM rendering
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Safe JSON parse with fallback
   */
  function safeParse(jsonString, fallback) {
    if (!jsonString) return fallback;
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.warn('[DawnBloom Storage] Corrupted JSON detected, restoring fallback:', e);
      return fallback;
    }
  }

  // Memory fallback store for Incognito / Strict Privacy / Cookies disabled modes
  const _memoryStore = {};

  function safeStorageGet(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null && val !== undefined) return val;
      }
    } catch (e) {
      // In private browsing mode where localStorage read throws SecurityError
    }
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const sVal = window.sessionStorage.getItem(key);
        if (sVal !== null && sVal !== undefined) return sVal;
      }
    } catch (e) {}
    return _memoryStore[key] !== undefined ? _memoryStore[key] : null;
  }

  function safeStorageSet(key, value) {
    _memoryStore[key] = String(value);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, String(value));
      }
    } catch (e) {
      // In private browsing mode where localStorage write throws
    }
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, String(value));
      }
    } catch (e) {}
    return true;
  }

  function safeStorageRemove(key) {
    delete _memoryStore[key];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      // In private browsing mode
    }
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
    } catch (e) {}
  }

  /**
   * Read collection from localStorage or in-memory fallback
   */
  function getCollection(key) {
    try {
      const item = safeStorageGet(key);
      return safeParse(item, []);
    } catch (e) {
      console.error(`[DawnBloom Storage] Error reading key "${key}":`, e);
      return [];
    }
  }

  /**
   * Save collection to localStorage with graceful in-memory fallback
   */
  function saveCollection(key, data) {
    try {
      safeStorageSet(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`[DawnBloom Storage] Error writing key "${key}":`, e);
      return false;
    }
  }

  /**
   * Generate an ID with prefix
   */
  function generateId(prefix = 'DB') {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Get single item by ID
   */
  function getItemById(key, id) {
    const collection = getCollection(key);
    return collection.find(item => item.id === id) || null;
  }

  /**
   * Add new item to collection
   */
  function addItem(key, item) {
    const collection = getCollection(key);
    if (!item.id) {
      item.id = generateId(key.replace('dawnbloom_', '').substring(0, 3).toUpperCase());
    }
    item.createdAt = item.createdAt || new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    collection.unshift(item);
    const success = saveCollection(key, collection);
    if (success) {
      logActivity('Create', `Added record to ${key}`, item.title || item.name || item.id);
    }
    return success ? item : null;
  }

  /**
   * Update existing item in collection
   */
  function updateItem(key, id, updatedFields) {
    const collection = getCollection(key);
    const index = collection.findIndex(item => item.id === id);
    if (index === -1) return null;

    collection[index] = {
      ...collection[index],
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };

    const success = saveCollection(key, collection);
    if (success) {
      logActivity('Update', `Modified record in ${key}`, collection[index].title || collection[index].name || id);
    }
    return success ? collection[index] : null;
  }

  /**
   * Delete item from collection
   */
  function deleteItem(key, id) {
    const collection = getCollection(key);
    const itemToDelete = collection.find(i => i.id === id);
    const filtered = collection.filter(item => item.id !== id);
    if (filtered.length === collection.length) return false;

    const success = saveCollection(key, filtered);
    if (success) {
      logActivity('Delete', `Deleted record from ${key}`, itemToDelete ? (itemToDelete.title || itemToDelete.name || id) : id);
    }
    return success;
  }

  /**
   * Append to the activity audit log
   */
  function logActivity(action, details, itemIdentifier) {
    try {
      const logs = getCollection(KEYS.ACTIVITY_LOG);
      const session = safeParse(safeStorageGet(KEYS.SESSION), null);
      const userName = session ? session.name : 'System';

      const entry = {
        id: generateId('LOG'),
        action: action,
        details: details,
        target: itemIdentifier || '',
        user: userName,
        timestamp: new Date().toISOString()
      };

      logs.unshift(entry);
      // Keep last 60 activities
      if (logs.length > 60) logs.pop();
      safeStorageSet(KEYS.ACTIVITY_LOG, JSON.stringify(logs));
    } catch (e) {
      console.warn('[DawnBloom] Failed to write activity log:', e);
    }
  }

  /**
   * Helper to generate realistic dynamic ISO dates relative to current date (offset in days).
   * Ensures dates are always realistic, upcoming, and never broken regardless of calendar year.
   */
  function getRelativeDate(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /**
   * Seed Initial Demo Data if not already present
   */
  function seedInitialData(force = false) {
    const alreadySeeded = safeStorageGet('dawnbloom_seeded_v3');
    if (alreadySeeded && !force) {
      return;
    }

    console.info('[DawnBloom] Seeding demonstration data (v3 with dynamic relative dates)...');

    // 1. Demo Users (Admin, Volunteer, and Students)
    const users = [
      {
        id: 'USR-ADMIN-01',
        name: 'Dr. Clara Vance',
        email: 'admin@dawnbloom.org',
        password: 'admin123', // NOTE: Demo educational purpose only
        role: 'Administrator',
        createdAt: '2026-08-15T09:00:00.000Z'
      },
      {
        id: 'USR-VOL-02',
        name: 'Sarah Jenkins',
        email: 'volunteer@dawnbloom.org',
        password: 'volunteer123', // NOTE: Demo educational purpose only
        role: 'Volunteer',
        volunteerId: 'VOL-001',
        createdAt: '2026-09-01T10:30:00.000Z'
      },
      {
        id: 'USR-STU-01',
        name: 'Leo M. (Demo Student)',
        studentId: 'STU-101',
        email: 'leo@dawnbloom.org',
        password: 'student123', // NOTE: Demo educational purpose only
        role: 'Student',
        createdAt: '2026-09-05T11:00:00.000Z'
      },
      {
        id: 'USR-STU-02',
        name: 'Maya T. (Demo Student)',
        studentId: 'STU-102',
        email: 'maya@dawnbloom.org',
        password: 'student123', // NOTE: Demo educational purpose only
        role: 'Student',
        createdAt: '2026-09-10T11:30:00.000Z'
      }
    ];

    // 2. 5 Fictional Volunteers
    const volunteers = [
      {
        id: 'VOL-001',
        name: 'Sarah Jenkins',
        email: 'sarah.jenkins@example.org',
        phone: '+1 (555) 234-8901',
        skills: 'Mathematics, Science, Public Speaking',
        interest: 'STEM Mentorship & Tutoring',
        availability: 'Weekends (Morning)',
        preferredDays: 'Saturday, Sunday',
        joinDate: '2026-02-10',
        status: 'Active',
        notes: 'Former high school math teacher with a passion for creative problem solving.'
      },
      {
        id: 'VOL-002',
        name: 'Marcus Vance',
        email: 'marcus.vance@example.org',
        phone: '+1 (555) 345-9012',
        skills: 'English Literature, Storytelling, Creative Writing',
        interest: 'Literacy & Communication',
        availability: 'Weekday Evenings',
        preferredDays: 'Tuesday, Thursday',
        joinDate: '2026-03-15',
        status: 'Active',
        notes: 'Librarian and children’s book reviewer. Coordinates library reading circles.'
      },
      {
        id: 'VOL-003',
        name: 'Elena Rostova',
        email: 'elena.rostova@example.org',
        phone: '+1 (555) 456-0123',
        skills: 'Fine Arts, Clay Modelling, Crafts',
        interest: 'Creative Arts & Expression',
        availability: 'Saturdays',
        preferredDays: 'Saturday',
        joinDate: '2026-04-05',
        status: 'Active',
        notes: 'Art academy graduate. Leads emotional expression through painting.'
      },
      {
        id: 'VOL-004',
        name: 'Priya Nair',
        email: 'priya.nair@example.org',
        phone: '+1 (555) 567-1234',
        skills: 'Coding, Computer Basics, Logic Puzzles',
        interest: 'Digital Literacy',
        availability: 'Sunday Mornings',
        preferredDays: 'Sunday',
        joinDate: '2026-05-18',
        status: 'Active',
        notes: 'Software engineer passionate about bridging the educational technology gap.'
      },
      {
        id: 'VOL-005',
        name: 'David Chen',
        email: 'david.chen@example.org',
        phone: '+1 (555) 678-2345',
        skills: 'Career Guidance, Resume Building, Confidence Coaching',
        interest: 'Adolescent Guidance',
        availability: 'On-Call / Monthly',
        preferredDays: 'Friday, Saturday',
        joinDate: '2026-06-20',
        status: 'Inactive',
        notes: 'On temporary leave for workplace relocation; available for remote advice.'
      }
    ];

    // 3. 5 Fictional Students (Respectful anonymized display names)
    const students = [
      {
        id: 'STU-101',
        name: 'Leo M. (Demo Student)',
        ageGroup: '10–12 Years',
        classLevel: 'Grade 6',
        subjects: 'Mathematics, Basic Science',
        guidanceNeeds: 'Needs confidence building in fractions and word problems.',
        assignedVolunteerId: 'VOL-001',
        assignedVolunteerName: 'Sarah Jenkins',
        enrollmentDate: '2026-06-01',
        status: 'Active'
      },
      {
        id: 'STU-102',
        name: 'Maya T. (Demo Student)',
        ageGroup: '8–10 Years',
        classLevel: 'Grade 4',
        subjects: 'English Reading, Spelling',
        guidanceNeeds: 'Eager reader; needs vocabulary expansion and phonics support.',
        assignedVolunteerId: 'VOL-002',
        assignedVolunteerName: 'Marcus Vance',
        enrollmentDate: '2026-06-15',
        status: 'Active'
      },
      {
        id: 'STU-103',
        name: 'Ethan W. (Demo Student)',
        ageGroup: '13–15 Years',
        classLevel: 'Grade 9',
        subjects: 'Computer Studies, Algebra',
        guidanceNeeds: 'Highly interested in computers; learning typing and basic coding.',
        assignedVolunteerId: 'VOL-004',
        assignedVolunteerName: 'Priya Nair',
        enrollmentDate: '2026-07-02',
        status: 'Active'
      },
      {
        id: 'STU-104',
        name: 'Aria G. (Demo Student)',
        ageGroup: '7–9 Years',
        classLevel: 'Grade 3',
        subjects: 'Drawing, Handwriting, General Science',
        guidanceNeeds: 'Creative learner; benefits from visual and craft-based lessons.',
        assignedVolunteerId: 'VOL-003',
        assignedVolunteerName: 'Elena Rostova',
        enrollmentDate: '2026-07-20',
        status: 'Active'
      },
      {
        id: 'STU-105',
        name: 'Nina P. (Demo Student)',
        ageGroup: '15–17 Years',
        classLevel: 'Grade 11',
        subjects: 'Career Preparation, Vocational Skills',
        guidanceNeeds: 'Requires guidance on post-secondary diploma courses and scholarships.',
        assignedVolunteerId: 'VOL-005',
        assignedVolunteerName: 'David Chen',
        enrollmentDate: '2026-08-10',
        status: 'On Hold'
      }
    ];

    // 4. Guidance Sessions (Upcoming and Completed)
    const guidance = [
      {
        id: 'GID-200',
        title: 'Foundational Numbers & Spatial Diagnostic',
        subject: 'Mathematics',
        studentId: 'STU-101',
        studentName: 'Leo M. (Demo Student)',
        volunteerId: 'VOL-001',
        volunteerName: 'Sarah Jenkins',
        date: getRelativeDate(-5),
        startTime: '10:00',
        endTime: '11:30',
        venue: 'Study Hall B',
        notes: 'Multiplication speed warmup and spatial geometry puzzles. Commendable curiosity.',
        status: 'Completed'
      },
      {
        id: 'GID-201',
        title: 'Fractions & Spatial Reasoning Lab',
        subject: 'Mathematics',
        studentId: 'STU-101',
        studentName: 'Leo M. (Demo Student)',
        volunteerId: 'VOL-001',
        volunteerName: 'Sarah Jenkins',
        date: getRelativeDate(3),
        startTime: '10:00',
        endTime: '11:30',
        venue: 'Study Hall B',
        notes: 'Visual fraction cards will be used to explain fraction addition.',
        status: 'Scheduled'
      },
      {
        id: 'GID-202',
        title: 'Adventures in Storytelling',
        subject: 'English Literacy',
        studentId: 'STU-102',
        studentName: 'Maya T. (Demo Student)',
        volunteerId: 'VOL-002',
        volunteerName: 'Marcus Vance',
        date: getRelativeDate(7),
        startTime: '16:00',
        endTime: '17:00',
        venue: 'Orphanage Library Corner',
        notes: 'Reading chapter 3 of "Charlotte’s Web" and practicing dialogue reading.',
        status: 'Scheduled'
      },
      {
        id: 'GID-203',
        title: 'Hands-on Block Coding Exploration',
        subject: 'Computer Basics',
        studentId: 'STU-103',
        studentName: 'Ethan W. (Demo Student)',
        volunteerId: 'VOL-004',
        volunteerName: 'Priya Nair',
        date: getRelativeDate(-2),
        startTime: '11:00',
        endTime: '12:30',
        venue: 'Computer Lab Room 2',
        notes: 'Completed the beginner maze puzzle algorithms. Great focus demonstrated.',
        status: 'Completed'
      },
      {
        id: 'GID-204',
        title: 'Visual Expression with Watercolors',
        subject: 'Creative Arts',
        studentId: 'STU-104',
        studentName: 'Aria G. (Demo Student)',
        volunteerId: 'VOL-003',
        volunteerName: 'Elena Rostova',
        date: getRelativeDate(-6),
        startTime: '14:00',
        endTime: '15:30',
        venue: 'Outdoor Activity Pavilion',
        notes: 'Color wheel mixing and autumn leaf sketches created.',
        status: 'Completed'
      },
      {
        id: 'GID-205',
        title: 'Foundational Phonics & Story Theater',
        subject: 'English Literacy',
        studentId: 'STU-102',
        studentName: 'Maya T. (Demo Student)',
        volunteerId: 'VOL-002',
        volunteerName: 'Marcus Vance',
        date: getRelativeDate(-11),
        startTime: '15:00',
        endTime: '16:00',
        venue: 'Children’s Library Room',
        notes: 'Read chapters 1 and 2 of Charlotte’s Web. Completed vocabulary puzzle sheet with 100% accuracy.',
        status: 'Completed'
      },
      {
        id: 'GID-206',
        title: 'Career Exploration: Software & Engineering Pathways',
        subject: 'Career Mentorship',
        studentId: 'STU-103',
        studentName: 'Ethan W. (Demo Student)',
        volunteerId: 'VOL-005',
        volunteerName: 'David Chen',
        date: getRelativeDate(-18),
        startTime: '11:00',
        endTime: '12:30',
        venue: 'Conference Room Alpha',
        notes: 'Discussed polytechnic technical courses, computer science roles, and study habits.',
        status: 'Completed'
      }
    ];

    // 5. 4 Events & Scheduling
    const events = [
      {
        id: 'EVT-301',
        name: 'Weekend Literacy & Book Fair',
        description: 'Interactive reading stations, gentle storytelling circles, and book gifting for children aged 6 to 14.',
        category: 'Reading Session',
        date: getRelativeDate(5),
        startTime: '09:30',
        endTime: '13:00',
        location: 'Main Community Hall',
        assignedVolunteers: ['VOL-002', 'VOL-003'],
        assignedVolunteerNames: 'Marcus Vance, Elena Rostova',
        expectedParticipants: 35,
        status: 'Scheduled'
      },
      {
        id: 'EVT-302',
        name: 'STEM Wonders: Little Inventors Day',
        description: 'Simple science experiments including baking soda volcanoes, battery circuits, and bridge building.',
        category: 'Educational Workshop',
        date: getRelativeDate(11),
        startTime: '10:00',
        endTime: '14:30',
        location: 'Science Discovery Lab',
        assignedVolunteers: ['VOL-001', 'VOL-004'],
        assignedVolunteerNames: 'Sarah Jenkins, Priya Nair',
        expectedParticipants: 28,
        status: 'Scheduled'
      },
      {
        id: 'EVT-303',
        name: 'Pathways Ahead: Career & Vocation Q&A',
        description: 'Gentle mentor roundtables introducing secondary students to careers in design, healthcare, and engineering.',
        category: 'Career Guidance',
        date: getRelativeDate(-4),
        startTime: '14:00',
        endTime: '17:00',
        location: 'Conference Room Alpha',
        assignedVolunteers: ['VOL-005', 'VOL-001'],
        assignedVolunteerNames: 'David Chen, Sarah Jenkins',
        expectedParticipants: 20,
        status: 'Completed'
      },
      {
        id: 'EVT-304',
        name: 'Autumn Sports & Friendship Games',
        description: 'Fun outdoor relays, badminton, and team games emphasizing cooperation and wellness.',
        category: 'Community Activity',
        date: getRelativeDate(18),
        startTime: '09:00',
        endTime: '12:00',
        location: 'Playground & Lawn',
        assignedVolunteers: ['VOL-001', 'VOL-002', 'VOL-003'],
        assignedVolunteerNames: 'Sarah Jenkins, Marcus Vance, Elena Rostova',
        expectedParticipants: 45,
        status: 'Scheduled',
        outcome: 'Scheduled for upcoming weekend.'
      },
      {
        id: 'EVT-305',
        name: 'Annual Youth Science & Arts Exhibition',
        description: 'Historical showcase of student science experiments, robotics models, and oil pastel paintings.',
        category: 'Educational Workshop',
        date: getRelativeDate(-14),
        startTime: '10:00',
        endTime: '15:30',
        location: 'Main Community Hall',
        assignedVolunteers: ['VOL-001', 'VOL-003'],
        assignedVolunteerNames: 'Sarah Jenkins, Elena Rostova',
        expectedParticipants: 50,
        status: 'Completed',
        outcome: '48 children proudly exhibited their models. 12 volunteer certificates were awarded.'
      },
      {
        id: 'EVT-306',
        name: 'Summer Reading Marathon & Story Theater',
        description: 'Historical three-day intensive literacy immersion with puppet shows and vocabulary drills.',
        category: 'Reading Session',
        date: getRelativeDate(-28),
        startTime: '09:00',
        endTime: '13:00',
        location: 'Children’s Library Room',
        assignedVolunteers: ['VOL-002', 'VOL-004'],
        assignedVolunteerNames: 'Marcus Vance, Priya Nair',
        expectedParticipants: 32,
        status: 'Completed',
        outcome: 'Students read a combined total of 115 books. 8 children advanced to higher reading bands.'
      }
    ];

    // 6. 5 Tasks
    const tasks = [
      {
        id: 'TSK-401',
        title: 'Prepare STEM Experiment Material Kits',
        description: 'Assemble 15 kits with measuring cups, safe test tubes, and instruction cards.',
        assignedVolunteerId: 'VOL-001',
        assignedVolunteerName: 'Sarah Jenkins',
        assignedStudentId: null,
        studentName: '',
        priority: 'High',
        dueDate: getRelativeDate(4),
        status: 'In Progress',
        relatedEventId: 'EVT-302',
        relatedEventName: 'STEM Wonders: Little Inventors Day'
      },
      {
        id: 'TSK-402',
        title: 'Curate Storybooks for Literacy Fair',
        description: 'Select 40 illustrated storybooks categorized by reading levels 1 through 4.',
        assignedVolunteerId: 'VOL-002',
        assignedVolunteerName: 'Marcus Vance',
        assignedStudentId: null,
        studentName: '',
        priority: 'Medium',
        dueDate: getRelativeDate(8),
        status: 'To Do',
        relatedEventId: 'EVT-301',
        relatedEventName: 'Weekend Literacy & Book Fair'
      },
      {
        id: 'TSK-403',
        title: 'Purchase Non-Toxic Watercolor Sets',
        description: 'Procure 20 sets of paintbrushes, watercolor palettes, and drawing sheets.',
        assignedVolunteerId: 'VOL-003',
        assignedVolunteerName: 'Elena Rostova',
        assignedStudentId: null,
        studentName: '',
        priority: 'Medium',
        dueDate: getRelativeDate(-3),
        status: 'Completed',
        relatedEventId: 'EVT-301',
        relatedEventName: 'Weekend Literacy & Book Fair'
      },
      {
        id: 'TSK-404',
        title: 'Install Offline Coding Software on 6 PCs',
        description: 'Ensure scratch and educational logic puzzles run smoothly without internet requirements.',
        assignedVolunteerId: 'VOL-004',
        assignedVolunteerName: 'Priya Nair',
        assignedStudentId: null,
        studentName: '',
        priority: 'High',
        dueDate: getRelativeDate(-1),
        status: 'Completed',
        relatedEventId: '',
        relatedEventName: 'General Program'
      },
      {
        id: 'TSK-405',
        title: 'Review Mid-Semester Student Guidance Log',
        description: 'Compile mentor observations into the monthly guidance summary for care supervisors.',
        assignedVolunteerId: 'VOL-005',
        assignedVolunteerName: 'David Chen',
        assignedStudentId: null,
        studentName: '',
        priority: 'Low',
        dueDate: getRelativeDate(14),
        status: 'To Do',
        relatedEventId: '',
        relatedEventName: 'Internal Coordination'
      },
      {
        id: 'TSK-406',
        title: 'Complete Fractions Practice Worksheet #3',
        description: 'Solve problems 1 to 10 using visual card methods discussed in mentoring session.',
        assignedVolunteerId: 'VOL-001',
        assignedVolunteerName: 'Sarah Jenkins',
        assignedStudentId: 'STU-101',
        studentName: 'Leo M. (Demo Student)',
        priority: 'High',
        dueDate: getRelativeDate(3),
        status: 'In Progress',
        relatedEventId: '',
        relatedEventName: 'Math Mentorship'
      },
      {
        id: 'TSK-407',
        title: 'Science Journal: Leaf Cell Sketch',
        description: 'Record sketches of two leaves observed during the garden walk.',
        assignedVolunteerId: 'VOL-001',
        assignedVolunteerName: 'Sarah Jenkins',
        assignedStudentId: 'STU-101',
        studentName: 'Leo M. (Demo Student)',
        priority: 'Medium',
        dueDate: getRelativeDate(7),
        status: 'To Do',
        relatedEventId: 'EVT-302',
        relatedEventName: 'STEM Wonders: Little Inventors Day'
      },
      {
        id: 'TSK-408',
        title: 'Practice Multiplication Tables 6 to 9',
        description: 'Complete 15-minute speed drill with study partner.',
        assignedVolunteerId: 'VOL-001',
        assignedVolunteerName: 'Sarah Jenkins',
        assignedStudentId: 'STU-101',
        studentName: 'Leo M. (Demo Student)',
        priority: 'Low',
        dueDate: getRelativeDate(-4),
        status: 'Completed',
        relatedEventId: '',
        relatedEventName: 'Math Mentorship'
      },
      {
        id: 'TSK-409',
        title: 'Chapter 4 Vocabulary Flashcards',
        description: 'Create illustrated cards for 5 new words from Charlotte’s Web.',
        assignedVolunteerId: 'VOL-002',
        assignedVolunteerName: 'Marcus Vance',
        assignedStudentId: 'STU-102',
        studentName: 'Maya T. (Demo Student)',
        priority: 'Medium',
        dueDate: getRelativeDate(5),
        status: 'To Do',
        relatedEventId: 'EVT-301',
        relatedEventName: 'Weekend Literacy & Book Fair'
      }
    ];

    // 7. 4 Activities & Programmes
    const activities = [
      {
        id: 'ACT-501',
        name: 'DawnBloom Reading Circle',
        description: 'Weekly guided reading sessions where students build phonics, vocabulary, and verbal expression.',
        category: 'Literacy Development',
        date: getRelativeDate(-1),
        duration: '1 Hour / Weekly',
        volunteersInvolved: 'Marcus Vance, Elena Rostova',
        targetGroup: 'Primary Students (Ages 7–11)',
        outcome: 'Students showed increased interest in reading unassisted; 12 books completed this month.',
        status: 'Ongoing'
      },
      {
        id: 'ACT-502',
        name: 'Digital Horizons Coding Club',
        description: 'Introductory computer skills, safe digital browsing, and block-based computational logic.',
        category: 'Skill Development',
        date: getRelativeDate(2),
        duration: '90 Minutes / Bi-weekly',
        volunteersInvolved: 'Priya Nair',
        targetGroup: 'Middle School (Ages 12–15)',
        outcome: 'All 8 participants successfully built an interactive animated greeting card.',
        status: 'Ongoing'
      },
      {
        id: 'ACT-503',
        name: 'Expressive Arts & Clay Studio',
        description: 'Creative arts sessions designed to promote emotional grounding, fine motor skills, and artistic joy.',
        category: 'Creative Expression',
        date: getRelativeDate(4),
        duration: '2 Hours',
        volunteersInvolved: 'Elena Rostova',
        targetGroup: 'All age groups',
        outcome: 'Created 24 clay miniature animals and displayed them in the orphanage reception area.',
        status: 'Completed'
      },
      {
        id: 'ACT-504',
        name: 'Future Pathways Mentorship',
        description: 'One-on-one sessions helping older youth understand vocational training options and build life skills.',
        category: 'Career Guidance',
        date: getRelativeDate(-8),
        duration: '2 Hours / Monthly',
        volunteersInvolved: 'David Chen, Sarah Jenkins',
        targetGroup: 'Secondary Students (Ages 15–18)',
        outcome: 'Scheduled for upcoming month; curriculum outlines prepared.',
        status: 'Planned'
      }
    ];

    // 8. User Preferences Default
    const defaultPreferences = {
      greetingType: 'DawnBloom Family',
      emailNotifications: true,
      compactView: false,
      themeAccent: 'blush-pink'
    };

    // 9. Initial Activity Logs
    const initialLogs = [
      {
        id: 'LOG-001',
        action: 'System Seed',
        details: 'Initial demonstration data generated successfully',
        target: 'DawnBloom Core',
        user: 'System',
        timestamp: new Date().toISOString()
      },
      {
        id: 'LOG-002',
        action: 'Event Scheduled',
        details: 'Added Weekend Literacy & Book Fair',
        target: 'EVT-301',
        user: 'Dr. Clara Vance',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: 'LOG-003',
        action: 'Session Completed',
        details: 'Completed Hands-on Block Coding Exploration',
        target: 'GID-203',
        user: 'Priya Nair',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
      }
    ];

    saveCollection(KEYS.USERS, users);
    saveCollection(KEYS.VOLUNTEERS, volunteers);
    saveCollection(KEYS.STUDENTS, students);
    saveCollection(KEYS.GUIDANCE, guidance);
    saveCollection(KEYS.EVENTS, events);
    saveCollection(KEYS.TASKS, tasks);
    saveCollection(KEYS.ACTIVITIES, activities);
    saveCollection(KEYS.PREFERENCES, defaultPreferences);
    saveCollection(KEYS.ACTIVITY_LOG, initialLogs);

    safeStorageSet('dawnbloom_seeded_v4', 'true');
    console.info('[DawnBloom] Initial demonstration data seeding completed.');
  }

  /**
   * Reset demonstration data back to fresh seeded state
   */
  function resetDemoData() {
    safeStorageRemove('dawnbloom_seeded_v1');
    safeStorageRemove('dawnbloom_seeded_v2');
    safeStorageRemove('dawnbloom_seeded_v3');
    safeStorageRemove('dawnbloom_seeded_v4');
    seedInitialData(true);
    logActivity('Reset', 'Demonstration data was reset to original seed state', 'All Collections');
  }

  // Ensure upgrade if migrated from previous seed versions
  (function checkMigration() {
    try {
      if (!safeStorageGet('dawnbloom_seeded_v4')) {
        seedInitialData(true);
      }
    } catch (e) {
      seedInitialData(true);
    }
  })();

  // Expose to window.DawnBloomStorage
  window.DawnBloomStorage = {
    KEYS,
    escapeHtml,
    getCollection,
    saveCollection,
    getItemById,
    addItem,
    updateItem,
    deleteItem,
    generateId,
    logActivity,
    resetDemoData,
    seedInitialData,
    safeStorageGet,
    safeStorageSet,
    safeStorageRemove
  };

})(window);
