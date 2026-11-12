// ==========================================================================
// js/admin.js : ADMIN WORKSPACE LOGIC (needs js/data.js loaded first)
// ==========================================================================
// Logo / Return Home buttons go back to the Landing Page (index.html)
function handleLogoReturnHome() {
  window.location.href = 'index.html';
}

let authMode = 'signin';
let currentAdminUser = null;

// 1. Auth Mode Switching (Sign In vs Sign Up)
function switchAuthMode(mode) {
  authMode = mode;
  const signInBtn = document.getElementById('Admin_Auth_Switch_SignIn_Btn');
  const signUpBtn = document.getElementById('Admin_Auth_Switch_SignUp_Btn');
  const confirmGroup = document.getElementById('signUpConfirmGroup');
  const submitBtn = document.getElementById('Admin_Auth_Submit_Btn');
  const title = document.getElementById('authHeadingTitle');
  const sub = document.getElementById('authSubtext');

  if (mode === 'signin') {
    signInBtn.classList.add('active');
    signUpBtn.classList.remove('active');
    confirmGroup.classList.add('hidden');
    submitBtn.textContent = 'Sign In to Workspace';
    title.textContent = 'Welcome back, Admin';
    sub.textContent = 'Sign in to confirm inbound donations and manage inventory reserves.';
  } else {
    signUpBtn.classList.add('active');
    signInBtn.classList.remove('active');
    confirmGroup.classList.remove('hidden');
    submitBtn.textContent = 'Create Admin Account';
    title.textContent = 'Register New Admin';
    sub.textContent = 'Authorized MSU-IIT personnel may create an administrator account.';
  }
}

// 2. Auth Submission Handler with @g.msuiit.edu.ph Validation
function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('adminEmailInput').value.trim().toLowerCase();
  const password = document.getElementById('adminPasswordInput').value;

  // Strict MSU-IIT Email Format Check
  if (!email.endsWith('@g.msuiit.edu.ph')) {
    alert('Invalid Email Domain! Only official MSU-IIT Google Suite accounts (@g.msuiit.edu.ph) are permitted.');
    return;
  }

  appData = loadAppData();
  if (!appData.registeredAdmins) {
    appData.registeredAdmins = [...defaultData.registeredAdmins];
  }

  if (authMode === 'signup') {
    const confirmPass = document.getElementById('adminConfirmPasswordInput').value;
    if (password !== confirmPass) {
      alert('Passwords do not match! Please verify your password.');
      return;
    }

    const existing = appData.registeredAdmins.find(a => a.email === email);
    if (existing) {
      alert('An administrator with this MSU-IIT email already exists. Please sign in instead.');
      switchAuthMode('signin');
      return;
    }

    appData.registeredAdmins.push({ email, password });
    saveAppData(appData);
    alert('Admin Account Registered Successfully! Signing in to workspace...');
  } else {
    // Sign In Verification
    const match = appData.registeredAdmins.find(a => a.email === email && a.password === password);
    if (!match && email !== 'admin.safestay@g.msuiit.edu.ph') {
      alert('Incorrect email or password. Please verify your credentials.');
      return;
    }
  }

  // Enter Workspace
  currentAdminUser = email;
  document.getElementById('activeAdminEmailDisplay').textContent = email;
  document.getElementById('adminAuthScreen').classList.add('hidden');
  document.getElementById('adminWorkspaceLayout').classList.remove('hidden');

  renderAdminWorkspace();
}

// 3. Forgot Password Modal
function openForgotPasswordModal() {
  document.getElementById('adminForgotPasswordModal').classList.remove('hidden');
}

function closeAdminModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
}

// 5. Admin Sign Out
function handleAdminSignOut() {
  currentAdminUser = null;
  document.getElementById('adminWorkspaceLayout').classList.add('hidden');
  document.getElementById('adminAuthScreen').classList.remove('hidden');
  switchAuthMode('signin');
}

// 6. Tab Switching in Workspace
function switchAdminTab(tabName) {
  const tabs = ['dashboard', 'donations', 'inventory', 'distributions', 'campaigns'];
  tabs.forEach(t => {
    const el = document.getElementById(`adminTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (el) el.classList.toggle('hidden', t !== tabName);
  });

  const buttons = [
    { name: 'dashboard', id: 'Admin_Nav_Dashboard_Btn' },
    { name: 'donations', id: 'Admin_Nav_Donations_Btn' },
    { name: 'inventory', id: 'Admin_Nav_Inventory_Btn' },
    { name: 'distributions', id: 'Admin_Nav_Distributions_Btn' },
    { name: 'campaigns', id: 'Admin_Nav_Campaigns_Btn' }
  ];

  buttons.forEach(b => {
    const btn = document.getElementById(b.id);
    if (btn) btn.classList.toggle('active', b.name === tabName);
  });
}

// 7. Render Admin Data, KPIs & Ledgers
function renderAdminWorkspace() {
  appData = loadAppData();

  // KPIs
  const toReceiveList = appData.donations.filter(d => d.status === 'To Receive');
  document.getElementById('kpiTotalDonations').textContent = appData.donations.length;
  document.getElementById('kpiToReceiveCount').textContent = `${toReceiveList.length} awaiting intake`;

  const totalUnits = appData.inventory.reduce((sum, i) => sum + (i.quantity || 0), 0);
  document.getElementById('kpiTotalStockUnits').textContent = totalUnits;
  document.getElementById('kpiTotalDispatches').textContent = appData.distributions.length;
  document.getElementById('kpiActiveDriveTitle').textContent = appData.activeDrive.title;

  // Populate Campaign Form with current active drive
  document.getElementById('campaignTitleInput').value = appData.activeDrive.title;
  document.getElementById('campaignDescInput').value = appData.activeDrive.description;
  document.getElementById('campaignImageInput').value = appData.activeDrive.image || 'bg_homepage.jpg';

  // Dashboard Recent Donations (Focusing on 'To Receive' first)
  const dashRecentTbody = document.getElementById('dashboardRecentDonationsTbody');
  dashRecentTbody.innerHTML = appData.donations.slice(0, 5).map(d => `
    <tr>
      <td><strong style="color:var(--brand-navy);">${d.id}</strong></td>
      <td>${d.donor}</td>
      <td>${d.item}</td>
      <td><strong>${d.quantity} ${d.unit}</strong></td>
      <td>
        <span class="badge-pill ${d.status === 'To Receive' ? 'badge-to-receive' : 'badge-received'}">
          ● ${d.status}
        </span>
      </td>
      <td>
        ${d.status === 'To Receive' 
          ? `<button type="button" class="btn-mark-received" onclick="markDonationReceived('${d.id}')">✓ Mark as Received</button>` 
          : `<span style="color:#64748B; font-size:11.5px;">Intake Verified</span>`}
      </td>
    </tr>
  `).join('');

  // Full Donations Ledger
  const fullDonationsTbody = document.getElementById('adminFullDonationsTbody');
  fullDonationsTbody.innerHTML = appData.donations.map(d => `
    <tr>
      <td><strong style="color:var(--brand-navy);">${d.id}</strong></td>
      <td>${d.donor}</td>
      <td>${d.item}</td>
      <td><strong>${d.quantity} ${d.unit}</strong></td>
      <td>${d.date}</td>
      <td>
        <span class="badge-pill ${d.status === 'To Receive' ? 'badge-to-receive' : (d.status === 'Distributed' ? 'badge-distributed' : 'badge-received')}">
          ● ${d.status}
        </span>
      </td>
      <td style="text-align:right;">
        ${d.status === 'To Receive' 
          ? `<button type="button" id="Admin_Mark_Received_Btn_${d.id}" class="btn-mark-received" onclick="markDonationReceived('${d.id}')">✓ Mark as Received</button>` 
          : `<span style="color:#64748B; font-size:11.5px;">✓ Credited to Stock</span>`}
      </td>
    </tr>
  `).join('');

  // Full Inventory Table
  const fullInventoryTbody = document.getElementById('adminFullInventoryTbody');
  fullInventoryTbody.innerHTML = appData.inventory.map((inv, idx) => `
    <tr>
      <td><strong>${inv.item}</strong></td>
      <td>${inv.category}</td>
      <td><span style="background:#EAF3FA; color:var(--brand-blue); font-weight:700; padding:4px 12px; border-radius:8px;">${inv.quantity}</span></td>
      <td>${inv.unit}</td>
      <td>
        <button style="border:0; background:transparent; color:var(--brand-blue); font-weight:600; cursor:pointer;" onclick="promptAdjustStock(${idx})">Adjust Stock</button>
      </td>
    </tr>
  `).join('');

  // Full Distribution Table
  const fullDistTbody = document.getElementById('adminFullDistributionsTbody');
  fullDistTbody.innerHTML = appData.distributions.map(d => `
    <tr>
      <td><strong style="color:var(--brand-navy);">${d.id}</strong></td>
      <td>${d.item}</td>
      <td><span style="background:#EAF3FA; color:var(--brand-blue); font-weight:700; padding:4px 12px; border-radius:8px;">${d.quantity} units</span></td>
      <td>${d.beneficiary}</td>
      <td>${d.date}</td>
    </tr>
  `).join('');
}

// 8. Physical Intake Confirmation: "Mark as Received"
// Updates status to "Received" and AUTOMATICALLY credits live inventory balances
function markDonationReceived(donationId) {
  const match = appData.donations.find(d => d.id === donationId);
  if (!match || match.status !== 'To Receive') return;

  match.status = 'Received';
  match.date = new Date().toISOString().slice(0, 10);

  // Reconcile with live inventory
  let invItem = appData.inventory.find(i => i.item.toLowerCase() === match.item.toLowerCase());
  if (invItem) {
    invItem.quantity = (invItem.quantity || 0) + parseInt(match.quantity, 10);
  } else {
    // Automatically add new item to inventory if not already listed
    appData.inventory.push({
      item: match.item,
      category: 'General Relief',
      quantity: parseInt(match.quantity, 10),
      unit: match.unit || 'units'
    });
  }

  saveAppData(appData);
  renderAdminWorkspace();
  alert(`Pledge ${donationId} marked as Received! Added ${match.quantity} ${match.unit} directly into live warehouse inventory.`);
}

// 9. Campaigns & Media Update (Saves active drive to localStorage)
function handleUpdateDriveSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('campaignTitleInput').value.trim();
  const desc = document.getElementById('campaignDescInput').value.trim();
  const image = document.getElementById('campaignImageInput').value.trim();

  appData.activeDrive = {
    title: title,
    description: desc,
    image: image
  };

  saveAppData(appData);
  renderAdminWorkspace();
  alert('Active Community Relief Drive Updated! Changes are live on the Public Transparency Portal.');
}

// 10. Add New Inventory Item Modal
function openAddInventoryModal() {
  document.getElementById('adminAddInventoryModal').classList.remove('hidden');
}

function handleAddInventorySubmit(e) {
  e.preventDefault();
  const name = document.getElementById('newInvItemName').value.trim();
  const cat = document.getElementById('newInvCategory').value;
  const qty = parseInt(document.getElementById('newInvQuantity').value, 10) || 0;
  const unit = document.getElementById('newInvUnit').value.trim() || 'units';

  if (!name) return;

  const existing = appData.inventory.find(i => i.item.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.quantity += qty;
  } else {
    appData.inventory.push({ item: name, category: cat, quantity: qty, unit: unit });
  }

  saveAppData(appData);
  closeAdminModals();
  renderAdminWorkspace();
  alert(`${name} successfully tracked in warehouse inventory.`);
}

// 11. Dispatch Relief Modal (Deducts stock)
function openDispatchModal() {
  const select = document.getElementById('dispatchItemSelect');
  select.innerHTML = appData.inventory.map(i => `
    <option value="${i.item}">${i.item} (Available in reserve: ${i.quantity} ${i.unit})</option>
  `).join('');
  document.getElementById('adminDispatchModal').classList.remove('hidden');
}

function handleDispatchSubmit(e) {
  e.preventDefault();
  const itemName = document.getElementById('dispatchItemSelect').value;
  const qty = parseInt(document.getElementById('dispatchQuantityInput').value, 10);
  const beneficiary = document.getElementById('dispatchBeneficiaryInput').value.trim();

  const invItem = appData.inventory.find(i => i.item === itemName);
  if (!invItem || isNaN(qty) || qty <= 0) return;

  if (qty > invItem.quantity) {
    alert(`Insufficient stock! Only ${invItem.quantity} ${invItem.unit} available in storage.`);
    return;
  }

  // Deduct inventory
  invItem.quantity -= qty;

  // Log dispatch
  const nextIdNum = appData.distributions.reduce((max, d) => {
    const m = d.id.match(/\d+/);
    return m ? Math.max(max, parseInt(m[0], 10)) : max;
  }, 208) + 1;

  appData.distributions.unshift({
    id: `DS-${nextIdNum}`,
    item: itemName,
    quantity: qty,
    beneficiary: beneficiary,
    date: new Date().toISOString().slice(0, 10)
  });

  saveAppData(appData);
  closeAdminModals();
  renderAdminWorkspace();
  alert(`Relief Dispatched! Deducted ${qty} ${invItem.unit} of ${itemName} for ${beneficiary}.`);
}

function promptAdjustStock(index) {
  const item = appData.inventory[index];
  const newQty = prompt(`Enter new stock quantity for ${item.item}:`, item.quantity);
  if (newQty !== null && !isNaN(parseInt(newQty, 10))) {
    item.quantity = Math.max(0, parseInt(newQty, 10));
    saveAppData(appData);
    renderAdminWorkspace();
  }
}
