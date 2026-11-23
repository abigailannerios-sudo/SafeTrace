// ==========================================================================
// js/donor.js : DONOR / STUDENT PORTAL LOGIC (index.html)
// Requires js/data.js loaded first.
// ==========================================================================
function escapeDonorHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[ch]);
}

// 1. Navigation between Welcome Page & Public Portal
function enterPublicTransparency() {
  document.getElementById('donorWelcomeScreen').classList.add('hidden');
  document.getElementById('donorTransparencyWorkspace').classList.remove('hidden');
  renderDonorPortal();
}

function returnToWelcomeScreen(event) {
  if (event) event.preventDefault();
  document.getElementById('donorTransparencyWorkspace').classList.add('hidden');
  document.getElementById('donorWelcomeScreen').classList.remove('hidden');
}

// 2. Secret 3-Click Admin Portal Trigger
let secretClickCount = 0;
let secretClickTimer = null;

function handleSecretAdminClick() {
  secretClickCount++;
  clearTimeout(secretClickTimer);
  secretClickTimer = setTimeout(() => { secretClickCount = 0; }, 1200);

  if (secretClickCount >= 3) {
    secretClickCount = 0;
    window.location.href = 'admin.html';
  }
}

// 3. Sidebar Tab Switching
function switchDonorTab(tabName) {
  const tabs = ['overview', 'track', 'distributions', 'inventory'];
  tabs.forEach(t => {
    const el = document.getElementById(`donorTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (el) el.classList.toggle('hidden', t !== tabName);
  });

  const navButtons = [
    { name: 'overview', id: 'Donor_Nav_Public_Btn' },
    { name: 'track', id: 'Donor_Nav_Track_Btn' },
    { name: 'distributions', id: 'Donor_Nav_Dist_Btn' },
    { name: 'inventory', id: 'Donor_Nav_Stock_Btn' }
  ];

  navButtons.forEach(b => {
    const btn = document.getElementById(b.id);
    if (btn) btn.classList.toggle('active', b.name === tabName);
  });
}

// 4. Render Public Portal (Drives, Supply Overview, Inventory & Distributions)
async function renderDonorPortal() {
  appData = await fetchAppDataAsync();

  const drive = appData.activeDrive || defaultData.activeDrive;
  const inventoryList = Array.isArray(appData.inventory) ? appData.inventory : [];
  const distributionsList = Array.isArray(appData.distributions) ? appData.distributions : [];

  // Active / Upcoming Drive Banner
  document.getElementById('publicDriveTitle').textContent = drive.title;
  document.getElementById('publicDriveDescription').textContent = drive.description;
  document.getElementById('publicDriveStatusBadge').textContent =
    drive.status === 'Upcoming' ? 'Upcoming Drive' : 'Current Drive';
  renderDriveCarousel(drive);

  // Datalist suggestions for Goods Pledge modal
  const dataList = document.getElementById('inventoryItemList');
  if (dataList) {
    dataList.innerHTML = inventoryList.map(i => `<option value="${escapeDonorHtml(i.name)}">`).join('');
  }

  // Live General Supply Overview Progress Bars
  const supplyBarsEl = document.getElementById('publicSupplyOverviewBars');
  const maxQty = Math.max(1, ...inventoryList.map(i => Number(i.quantity) || 0));
  if (inventoryList.length === 0) {
    supplyBarsEl.innerHTML = '<div style="font-size:13px; color:#64748b; text-align:center;">No relief supplies tracked yet.</div>';
  } else {
    supplyBarsEl.innerHTML = inventoryList.map(i => {
      const qty = Math.max(0, Number(i.quantity) || 0);
      const pct = qty === 0 ? 4 : Math.max(10, Math.min(100, Math.round((qty / maxQty) * 100)));
      return `
        <div class="supply-progress-row">
          <div class="supply-progress-header">
            <span class="supply-progress-label">${escapeDonorHtml(i.name)}</span>
            <span class="supply-progress-count">${qty} ${escapeDonorHtml(i.unit || 'pcs')}</span>
          </div>
          <div class="supply-progress-track">
            <div class="supply-progress-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Public Supply Availability Table
  document.getElementById('publicFullInventoryTable').innerHTML = inventoryList.map(i => `
    <tr>
      <td><strong>${escapeDonorHtml(i.name)}</strong></td>
      <td style="color:#64748B;">${escapeDonorHtml(i.category || 'General Relief')}</td>
      <td><span class="badge-number-stock">${Number(i.quantity) || 0}</span></td>
      <td>${escapeDonorHtml(i.unit || 'pcs')}</td>
    </tr>
  `).join('');

  // Public Distribution Logs Table
  document.getElementById('publicDistributionsTable').innerHTML = distributionsList.map(d => `
    <tr>
      <td><strong style="color:var(--brand-navy);">${escapeDonorHtml(d.distributionId)}</strong></td>
      <td>${escapeDonorHtml(d.itemName)}</td>
      <td><span class="badge-number-stock">${Number(d.quantity) || 0}</span></td>
      <td>${escapeDonorHtml(d.beneficiary)}</td>
      <td>${escapeDonorHtml(d.dispatchedAt)}</td>
    </tr>
  `).join('');
}

// 5. Scrollable & Nextable Drive Banner Carousel
let currentDriveSlide = 0;
let totalDriveSlides = 1;
let driveScrollBound = false;

function renderDriveCarousel(driveObj) {
  const track = document.getElementById('publicDriveCarouselTrack');
  const dotsContainer = document.getElementById('publicDriveCarouselDots');
  const prevBtn = document.getElementById('publicDrivePrevBtn');
  const nextBtn = document.getElementById('publicDriveNextBtn');
  if (!track || !dotsContainer) return;

  const images = Array.isArray(driveObj.images) && driveObj.images.length > 0
    ? driveObj.images
    : [driveObj.image || 'bg_homepage.png'];

  totalDriveSlides = images.length;
  currentDriveSlide = 0;

  track.innerHTML = images.map((src, idx) => `
    <div class="campaign-banner-slide">
      <img
        src="${escapeDonorHtml(src)}"
        alt="${escapeDonorHtml(driveObj.title)} — Photo ${idx + 1}"
        onerror="if (!this.dataset.fb) { this.dataset.fb='1'; this.src='bg_homepage.png'; }"
      />
    </div>
  `).join('');

  if (totalDriveSlides > 1) {
    dotsContainer.classList.remove('hidden');
    dotsContainer.innerHTML = images.map((_, idx) => `
      <button
        type="button"
        class="campaign-banner-dot ${idx === 0 ? 'active' : ''}"
        aria-label="Go to slide ${idx + 1}"
        onclick="goToDriveSlide(${idx})"
      ></button>
    `).join('');
    prevBtn.classList.remove('hidden');
    nextBtn.classList.remove('hidden');
  } else {
    dotsContainer.innerHTML = '';
    dotsContainer.classList.add('hidden');
    prevBtn.classList.add('hidden');
    nextBtn.classList.add('hidden');
  }

  track.scrollTo({ left: 0, behavior: 'auto' });

  if (!driveScrollBound) {
    driveScrollBound = true;
    let tick = null;
    track.addEventListener('scroll', () => {
      clearTimeout(tick);
      tick = setTimeout(() => {
        const slideWidth = track.clientWidth || 1;
        updateDriveCarouselDots(Math.round(track.scrollLeft / slideWidth));
      }, 60);
    }, { passive: true });
  }
}

function updateDriveCarouselDots(index) {
  currentDriveSlide = Math.max(0, Math.min(index, totalDriveSlides - 1));
  document.querySelectorAll('#publicDriveCarouselDots .campaign-banner-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentDriveSlide);
  });
}

function goToDriveSlide(index) {
  const track = document.getElementById('publicDriveCarouselTrack');
  if (!track || totalDriveSlides <= 1) return;
  const wrapped = (index + totalDriveSlides) % totalDriveSlides;
  currentDriveSlide = wrapped;
  track.scrollTo({ left: wrapped * track.clientWidth, behavior: 'smooth' });
  updateDriveCarouselDots(wrapped);
}

function stepDriveCarousel(delta) {
  goToDriveSlide(currentDriveSlide + delta);
}

// 6. Track Donation Status by Reference Code
async function handleSearchReference() {
  const code = document.getElementById('donorTrackInput').value.trim().toUpperCase();
  const resultBox = document.getElementById('donorTrackResultBox');

  if (!code) {
    resultBox.innerHTML = '<div style="color:#C53B3B; font-size:13px; margin-top:10px;">Please enter a valid reference code.</div>';
    return;
  }

  appData = await fetchAppDataAsync();
  const match = appData.donations.find(d => String(d.referenceCode || '').toUpperCase() === code);

  if (!match) {
    resultBox.innerHTML = `
      <div class="donor-card" style="border-left:4px solid #C53B3B; margin-top:18px;">
        <div class="donor-card-body">
          <strong style="color:#C53B3B; font-size:14px; display:block; margin-bottom:4px;">Reference Code Not Found</strong>
          <p style="font-size:12.5px; color:#64748B;">No record found matching <strong>${escapeDonorHtml(code)}</strong>. Please double-check your receipt code.</p>
        </div>
      </div>
    `;
    return;
  }

  const statusLower = String(match.status || '').toLowerCase();
  const badgeCls =
    statusLower === 'to receive'
      ? 'badge-to-receive'
      : statusLower === 'distributed'
        ? 'badge-distributed'
        : 'badge-received';

  const detailsLine = match.type === 'cash'
    ? `₱${Number(match.amount || 0).toLocaleString()} via ${escapeDonorHtml(match.hub || 'QR Transfer')}`
    : `${Number(match.quantity) || 0} ${escapeDonorHtml(match.unit || 'pcs')} of ${escapeDonorHtml(match.itemName)}`;

  const statusNote =
    statusLower === 'to receive'
      ? (match.type === 'cash'
          ? 'This cash transfer is logged and awaiting verification by MISSC administrators.'
          : 'This pledge is awaiting physical arrival at the MISSC drop-off hub.')
      : statusLower === 'distributed'
        ? 'This contribution has been received and distributed to student boarders.'
        : 'This contribution has been officially verified and received by MISSC.';

  resultBox.innerHTML = `
    <div class="donor-card" style="border-left:4px solid var(--brand-blue); margin-top:18px;">
      <div class="donor-card-body">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:12px;">
          <h3 style="font-size:18px; color:var(--brand-navy);">${escapeDonorHtml(match.referenceCode)}</h3>
          <span class="badge-pill ${badgeCls}">● ${escapeDonorHtml(match.status)}</span>
        </div>
        <p style="font-size:13.5px; margin-bottom:6px;"><strong>Contribution:</strong> ${detailsLine}</p>
        <p style="font-size:12.5px; color:#64748B; margin-bottom:8px;"><strong>Type:</strong> ${match.type === 'cash' ? 'Cash Donation' : 'Goods Donation'} · <strong>Date:</strong> ${escapeDonorHtml(match.date)}</p>
        <p style="font-size:12.5px; color:#475569; line-height:1.6;">${statusNote}</p>
      </div>
    </div>
  `;
}

// 7. Modals & Donation Submission (Goods + Cash)
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

function inferPackagingUnit(itemName) {
  const rules = [
    { match: /\bcanned\s+goods?\b/i, unit: 'cans' },
    { match: /\bhygiene\s+kits?\b/i, unit: 'kits' },
    { match: /\brice/i, unit: 'packs' },
    { match: /\bnoodles?\b/i, unit: 'packs' },
    { match: /\bschool\s+supplies?\b/i, unit: 'sets' }
  ];
  const hit = rules.find(r => r.match.test(itemName));
  return hit ? hit.unit : 'pcs';
}

function generateNextReferenceCode() {
  const nextNum = appData.donations.reduce((max, d) => {
    const m = String(d.referenceCode || '').match(/\d+/);
    return m ? Math.max(max, parseInt(m[0], 10)) : max;
  }, 1048) + 1;
  return `ST-${nextNum}`;
}

function showReceiptConfirmation(refCode, summaryHtml) {
  document.getElementById('generatedReceiptCodeBox').textContent = refCode;
  document.getElementById('generatedReceiptSummaryText').innerHTML = summaryHtml;
  document.getElementById('donorReceiptModal').classList.remove('hidden');
}

async function handleGoodsPledgeSubmit(e) {
  e.preventDefault();
  const donorName = document.getElementById('donorNameInput').value.trim() || 'Anonymous Donor';
  const itemName = document.getElementById('donorItemInput').value.trim();
  const category = document.getElementById('donorCategoryInput').value.trim();
  const qty = parseInt(document.getElementById('donorQuantityInput').value, 10);
  const unit = inferPackagingUnit(itemName);
  const hub = document.getElementById('donorDropOffSelect').value.trim();
  const dropOffDate = document.getElementById('donorDropOffDateInput').value;
  const notes = document.getElementById('donorNotesInput').value.trim();

  if (!itemName || !category || !hub || !dropOffDate || isNaN(qty) || qty <= 0) return;

  appData = await fetchAppDataAsync();
  const refCode = generateNextReferenceCode();
  const matchedInv = appData.inventory.find(i => i.name.toLowerCase() === itemName.toLowerCase());

  const newDonation = {
    referenceCode: refCode,
    donorName,
    type: 'goods',
    itemId: matchedInv ? matchedInv.itemId : null,
    itemName,
    category,
    quantity: qty,
    amount: 0,
    unit,
    status: 'To Receive',
    date: new Date().toISOString().slice(0, 10),
    hub,
    dropOffDate,
    notes
  };

  appData.donations.unshift(newDonation);
  saveAppData(appData);
  await insertDonationAsync(newDonation);

  document.getElementById('donorGoodsForm').reset();
  closeModals();
  showReceiptConfirmation(
    refCode,
    `Donor: <strong>${escapeDonorHtml(donorName)}</strong><br />
     Donation: <strong>${qty} ${escapeDonorHtml(unit)} of ${escapeDonorHtml(itemName)}</strong><br />
     Drop-off location: <strong>${escapeDonorHtml(hub)}</strong>`
  );
  renderDonorPortal();
}

async function handleMoneyDonationSubmit(e) {
  e.preventDefault();
  const donorName = document.getElementById('moneyDonorNameInput').value.trim() || 'Anonymous Donor';
  const channel = document.getElementById('moneyChannelSelect').value;
  const amount = parseFloat(document.getElementById('moneyAmountInput').value);
  const notes = document.getElementById('moneyNotesInput').value.trim();

  if (isNaN(amount) || amount <= 0) return;

  appData = await fetchAppDataAsync();
  const refCode = generateNextReferenceCode();

  const newDonation = {
    referenceCode: refCode,
    donorName,
    type: 'cash',
    itemId: null,
    itemName: `Cash Donation (${channel})`,
    category: 'Monetary',
    quantity: 1,
    amount,
    unit: 'PHP',
    status: 'To Receive',
    date: new Date().toISOString().slice(0, 10),
    hub: channel,
    dropOffDate: '',
    notes
  };

  appData.donations.unshift(newDonation);
  saveAppData(appData);
  await insertDonationAsync(newDonation);

  document.getElementById('donorMoneyForm').reset();
  closeModals();
  showReceiptConfirmation(
    refCode,
    `Donor: <strong>${escapeDonorHtml(donorName)}</strong><br />
     Cash Amount: <strong>₱${amount.toLocaleString()}</strong> via <strong>${escapeDonorHtml(channel)}</strong><br />
     Status: <strong>To Receive (Pending Admin Verification)</strong>`
  );
  renderDonorPortal();
}

function trackGeneratedReceipt() {
  const code = document.getElementById('generatedReceiptCodeBox').textContent.trim();
  closeModals();
  switchDonorTab('track');
  document.getElementById('donorTrackInput').value = code;
  handleSearchReference();
}

// 8. QR Code Zoom Lightbox
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

// 9. Initialization & Keyboard / Backdrop Listeners
document.addEventListener('DOMContentLoaded', () => {
  renderDonorPortal();

  const trackInput = document.getElementById('donorTrackInput');
  if (trackInput) {
    trackInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSearchReference();
      }
    });
  }

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', event => {
      if (event.target === overlay) {
        if (overlay.id === 'donorQRZoomModal') closeQRZoom();
        else closeModals();
      }
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const qrZoom = document.getElementById('donorQRZoomModal');
      if (qrZoom && !qrZoom.classList.contains('hidden')) closeQRZoom();
      else closeModals();
    }
  });
});
