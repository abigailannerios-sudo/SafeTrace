// ==========================================================================
// js/data.js : SHARED STATE & LOCALSTORAGE (loaded first by donor.html and admin.html)
// ==========================================================================
const STORAGE_KEY = 'safestay_system_data_v1';

// Default Seed Data
const defaultData = {
  registeredAdmins: [
    { email: 'admin.safestay@g.msuiit.edu.ph', password: 'AdminSafeStay2026!' }
  ],
  activeDrive: {
    title: 'Bagyong Paeng Student Boarder Relief Drive',
    description: 'Coordinating emergency sustenance, bedding packs, and hygiene support directly for affected university student boarders and community evacuation facilities across Iligan City.',
    image: 'bg_homepage.jpg'
  },
  donations: [
    { id: 'ST-1048', donor: 'Maria Santos', item: 'Hygiene kits', quantity: 12, unit: 'kits', status: 'Received', date: '2026-10-18' },
    { id: 'ST-1042', donor: 'MSU-IIT Student Council', item: 'Canned goods', quantity: 40, unit: 'cans', status: 'Distributed', date: '2026-10-14' },
    { id: 'ST-1039', donor: 'Juan Dela Cruz', item: 'School supplies', quantity: 20, unit: 'sets', status: 'Received', date: '2026-10-12' },
    { id: 'ST-1027', donor: 'Engr. Ramos', item: 'Blankets', quantity: 6, unit: 'pcs', status: 'Distributed', date: '2026-10-03' }
  ],
  inventory: [
    { item: 'Hygiene kits', category: 'Personal care', quantity: 24, unit: 'kits' },
    { item: 'Canned goods', category: 'Food', quantity: 120, unit: 'cans' },
    { item: 'Blankets', category: 'Bedding', quantity: 18, unit: 'pcs' },
    { item: 'School supplies', category: 'Education', quantity: 42, unit: 'sets' },
    { item: 'Rice packs', category: 'Food', quantity: 8, unit: 'packs' }
  ],
  distributions: [
    { id: 'DS-208', item: 'Canned goods', quantity: 40, beneficiary: 'Community Relief Activity', date: '2026-10-16' },
    { id: 'DS-207', item: 'Blankets', quantity: 6, beneficiary: 'Student Assistance Program', date: '2026-10-05' }
  ]
};

function loadAppData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const data = saved ? JSON.parse(saved) : defaultData;
    if (!data.registeredAdmins) data.registeredAdmins = defaultData.registeredAdmins; // Older saved data may lack admin accounts
    return data;
  } catch (e) {
    return defaultData;
  }
}

function saveAppData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('LocalStorage write failed:', e);
  }
}

let appData = loadAppData();
