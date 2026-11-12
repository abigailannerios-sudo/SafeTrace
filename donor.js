// ==========================================================================
// js/donor.js : DONOR TRANSPARENCY PORTAL LOGIC (needs js/data.js loaded first)
// ==========================================================================
// Logo / Return Home buttons go back to the Landing Page (index.html)
function handleLogoReturnHome() {
  window.location.href = 'index.html';
}

// 1. Navigation: Enter Public Transparency Portal
function enterPublicTransparency() {
  document.getElementById('donorWelcomeScreen').classList.add('hidden');
  document.getElementById('donorTransparencyWorkspace').classList.remove('hidden');
  renderDonorTables();
}

// 2. Secret 3-Click Admin Trigger
let secretClickCount = 0;
let secretClickTimer = null;

function handleSecretAdminClick() {
  secretClickCount++;
  clearTimeout(secretClickTimer);
  secretClickTimer = setTimeout(() => { secretClickCount = 0; }, 1200);

  if (secretClickCount >= 3) {
    secretClickCount = 0;
    window.location.href = 'admin.html'; // Opens the Admin Sign-In Screen (admin.html)
  }
}

// 4. Tab Switching inside Transparency Portal
function switchDonorTab(tabName) {
  const tabs = ['overview', 'track', 'distributions', 'inventory'];
  tabs.forEach(t => {
    const el = document.getElementById(`donorTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (el) el.classList.toggle('hidden', t !== tabName);
  });

  const buttons = [
    { name: 'overview', id: 'Donor_Nav_Public_Btn' },
    { name: 'track', id: 'Donor_Nav_Track_Btn' },
    { name: 'distributions', id: 'Donor_Nav_Dist_Btn' },
    { name: 'inventory', id: 'Donor_Nav_Stock_Btn' }
  ];

  buttons.forEach(b => {
    const btn = document.getElementById(b.id);
    if (btn) btn.classList.toggle('active', b.name === tabName);
  });
}

// 5. Render Live Tables with Numerical In-Stock Quantities
function renderDonorTables() {
  appData = loadAppData();

  // Render Active Campaign Banner
  document.getElementById('publicDriveTitle').textContent = appData.activeDrive.title;
  document.getElementById('publicDriveDescription').textContent = appData.activeDrive.description;
  if (appData.activeDrive.image) {
    document.getElementById('publicDriveImage').src = appData.activeDrive.image;
  }

  // Populate Datalist for pledge form
  const dataList = document.getElementById('inventoryItemList');
  dataList.innerHTML = appData.inventory.map(i => `<option value="${i.item}">`).join('');

  // Summary Stock Table (Numerical Only)
  const summaryTbody = document.getElementById('publicSummaryStockTable');
  summaryTbody.innerHTML = appData.inventory.map(i => `
    <tr>
      <td><strong>${i.item}</strong></td>
      <td style="color:#64748B;">${i.category}</td>
      <td><span class="badge-number-stock">${i.quantity} ${i.unit}</span></td>
    </tr>
  `).join('');

  // Full Supply Table (Numerical Only)
  const fullTbody = document.getElementById('publicFullInventoryTable');
  fullTbody.innerHTML = appData.inventory.map(i => `
    <tr>
      <td><strong>${i.item}</strong></td>
      <td style="color:#64748B;">${i.category}</td>
      <td><span class="badge-number-stock">${i.quantity}</span></td>
      <td>${i.unit}</td>
    </tr>
  `).join('');

  // Distribution Logs Table
  const distTbody = document.getElementById('publicDistributionsTable');
  distTbody.innerHTML = appData.distributions.map(d => `
    <tr>
      <td><strong style="color:var(--brand-navy);">${d.id}</strong></td>
      <td>${d.item}</td>
      <td><span class="badge-number-stock">${d.quantity} units</span></td>
      <td>${d.beneficiary}</td>
      <td>${d.date}</td>
    </tr>
  `).join('');
}

// 6. Track Reference Code Search
function handleSearchReference() {
  const code = document.getElementById('donorTrackInput').value.trim().toUpperCase();
  const resultBox = document.getElementById('donorTrackResultBox');

  if (!code) {
    resultBox.innerHTML = '<div style="color:#C53B3B; font-size:13px; margin-top:10px;">Please enter a valid reference code.</div>';
    return;
  }

  const match = appData.donations.find(d => d.id.toUpperCase() === code);
  if (match) {
    const badgeCls = match.status === 'To Receive' ? 'badge-to-receive' : 'badge-received';
    resultBox.innerHTML = `
      <div class="donor-card" style="border-left:4px solid var(--brand-blue); margin-top:18px;">
        <div class="donor-card-body">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3 style="font-size:18px; color:var(--brand-navy);">${match.id}</h3>
            <span class="badge-pill ${badgeCls}">● ${match.status}</span>
          </div>
          <p style="font-size:13.5px; margin-bottom:6px;"><strong>Supply Item:</strong> ${match.quantity} ${match.unit} of ${match.item}</p>
          <p style="font-size:12.5px; color:#64748B; margin-bottom:8px;">Recorded Date: ${match.date}</p>
          <p style="font-size:12px; color:#475569; line-height:1.6;">
            ${match.status === 'To Receive' 
              ? 'This pledge is awaiting physical arrival at the storage hub. SafeStay admins will verify and add it to live inventory upon intake.' 
              : 'This item has been officially verified, received into live warehouse inventory, and allocated for student boarder relief.'}
          </p>
        </div>
      </div>
    `;
  } else {
    resultBox.innerHTML = `
      <div class="donor-card" style="border-left:4px solid #C53B3B; margin-top:18px;">
        <div class="donor-card-body">
          <strong style="color:#C53B3B; font-size:14px; display:block; margin-bottom:4px;">Reference Code Not Found</strong>
          <p style="font-size:12.5px; color:#64748B;">No record found matching <strong>${code}</strong>. Please double-check your receipt code.</p>
        </div>
      </div>
    `;
  }
}

// 7. Modal Handlers
function openChoiceModal() {
  document.getElementById('donorChoiceModal').classList.remove('hidden');
}

function openGoodsPledgeModal() {
  closeModals();
  document.getElementById('donorGoodsModal').classList.remove('hidden');
}

function openMoneyDonationModal() {
  closeModals();
  document.getElementById('donorMoneyModal').classList.remove('hidden');
}

function closeModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
}

// 8. Goods Pledge Submission -> Status: "To Receive" (Inventory UNTOUCHED)
function handleGoodsPledgeSubmit(e) {
  e.preventDefault();

  const donorName = document.getElementById('donorNameInput').value.trim() || 'Anonymous Donor';
  const item = document.getElementById('donorItemInput').value.trim();
  const qty = parseInt(document.getElementById('donorQuantityInput').value, 10);
  const unit = document.getElementById('donorUnitInput').value.trim() || 'units';
  const hub = document.getElementById('donorDropOffSelect').value;
  const notes = document.getElementById('donorNotesInput').value.trim();

  if (!item || isNaN(qty) || qty <= 0) return;

  // Generate next ST-XXXX reference code
  const nextNum = appData.donations.reduce((max, d) => {
    const m = d.id.match(/\d+/);
    return m ? Math.max(max, parseInt(m[0], 10)) : max;
  }, 1048) + 1;

  const newId = `ST-${nextNum}`;
  const today = new Date().toISOString().slice(0, 10);

  // Create pledge with status: "To Receive"
  const newDonation = {
    id: newId,
    donor: donorName,
    item: item,
    quantity: qty,
    unit: unit,
    status: 'To Receive',
    date: today,
    hub: hub,
    notes: notes
  };

  appData.donations.unshift(newDonation);
  saveAppData(appData);

  // Reset form & display confirmation modal
  document.getElementById('donorGoodsForm').reset();
  closeModals();

  document.getElementById('generatedReceiptCodeBox').textContent = newId;
  document.getElementById('generatedReceiptSummaryText').innerHTML = `
    Donor: <strong>${donorName}</strong><br />
    Pledged: <strong>${qty} ${unit} of ${item}</strong><br />
    Target Hub: <strong>${hub}</strong><br />
    Status: <span class="badge-pill badge-to-receive">● To Receive</span>
  `;
  document.getElementById('donorReceiptModal').classList.remove('hidden');

  renderDonorTables();
}

// 9. QR Code Zoom Lightbox
function zoomQRCode(service, accNumber, accName) {
  const zoomContainer = document.getElementById('qrZoomSvgContainer');
  const isGCash = service === 'GCash';

  zoomContainer.innerHTML = isGCash ? `
    <svg viewBox="0 0 100 100" fill="#122464" width="220" height="220">
      <rect width="100" height="100" fill="#FFFFFF"/>
      <path d="M10 10h30v30h-30zM15 15h20v20h-20zM20 20h10v10h-10z"/>
      <path d="M60 10h30v30h-30zM65 15h20v20h-20zM70 20h10v10h-10z"/>
      <path d="M10 60h30v30h-30zM15 65h20v20h-20zM20 70h10v10h-10z"/>
      <rect x="45" y="15" width="8" height="8"/>
      <rect x="45" y="30" width="8" height="8"/>
      <rect x="15" y="45" width="8" height="8"/>
      <rect x="30" y="45" width="8" height="8"/>
      <rect x="45" y="45" width="10" height="10" fill="#1D74B3"/>
      <rect x="60" y="45" width="8" height="8"/>
      <rect x="75" y="45" width="8" height="8"/>
      <rect x="45" y="60" width="8" height="8"/>
      <rect x="60" y="60" width="12" height="8"/>
      <rect x="75" y="75" width="15" height="15"/>
    </svg>
  ` : `
    <svg viewBox="0 0 100 100" fill="#122464" width="220" height="220">
      <rect width="100" height="100" fill="#FFFFFF"/>
      <path d="M10 10h30v30h-30zM15 15h20v20h-20zM20 20h10v10h-10z"/>
      <path d="M60 10h30v30h-30zM65 15h20v20h-20zM70 20h10v10h-10z"/>
      <path d="M10 60h30v30h-30zM15 65h20v20h-20zM20 70h10v10h-10z"/>
      <rect x="45" y="12" width="6" height="12"/>
      <rect x="52" y="25" width="6" height="15"/>
      <rect x="12" y="48" width="10" height="6"/>
      <rect x="25" y="52" width="15" height="6"/>
      <rect x="45" y="45" width="10" height="10" fill="#1D74B3"/>
      <rect x="62" y="48" width="12" height="6"/>
      <rect x="78" y="48" width="10" height="6"/>
      <rect x="48" y="65" width="15" height="8"/>
      <rect x="68" y="62" width="12" height="15"/>
      <rect x="82" y="80" width="8" height="8"/>
    </svg>
  `;

  document.getElementById('qrZoomTitle').textContent = `${service} Official QR`;
  document.getElementById('qrZoomAccountName').textContent = accName;
  document.getElementById('qrZoomAccountNumber').textContent = `Account: ${accNumber}`;
  document.getElementById('donorQRZoomModal').classList.remove('hidden');
}

function closeQRZoom() {
  document.getElementById('donorQRZoomModal').classList.add('hidden');
}

// Initialize tables on load
document.addEventListener('DOMContentLoaded', () => {
  renderDonorTables();
});
