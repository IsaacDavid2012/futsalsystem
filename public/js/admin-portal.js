const state = {
  me: null,
  bookings: [],
  customers: [],
};

const byId = (id) => document.getElementById(id);

function showFlash(message, type = '') {
  const flash = byId('flashMessage');
  if (!flash) {
    return;
  }
  flash.className = `flash ${type}`.trim();
  flash.textContent = message || '';
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch (_) {
    payload = {};
  }

  if (!response.ok) {
    const message = payload.message || 'Request failed.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return payload;
}

function setDefaultDates() {
  const startDate = byId('startDate');
  const endDate = byId('endDate');
  if (!startDate || !endDate) {
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  startDate.value = today;
  endDate.value = today;
}

function buildCustomers(bookings) {
  const map = new Map();

  bookings.forEach((booking) => {
    const key = booking.customerEmail || `customer-${booking.id}`;
    if (!map.has(key)) {
      map.set(key, {
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        totalBookings: 0,
        active: 0,
        cancelled: 0,
        spend: 0,
        refund: 0,
      });
    }

    const customer = map.get(key);
    customer.totalBookings += 1;
    customer.spend += Number(booking.price || 0);
    customer.refund += Number(booking.refund || 0);
    if (booking.status === 'confirmed') {
      customer.active += 1;
    }
    if (booking.status === 'cancelled') {
      customer.cancelled += 1;
    }
  });

  return [...map.values()];
}

function renderSummary(summary) {
  byId('totalBookings').textContent = String(summary.totalBookings || 0);
  byId('activeBookings').textContent = String(summary.activeBookings || 0);
  byId('cancelledBookings').textContent = String(summary.cancelledBookings || 0);
  byId('netRevenue').textContent = `$${Number(summary.netRevenue || 0).toFixed(2)}`;
}

function renderUtilization(utilization = {}) {
  const container = byId('utilizationList');
  if (!container) {
    return;
  }

  container.innerHTML = [1, 2, 3, 4, 5].map((court) => {
    const data = utilization[court] || { booked: 0, utilizationPct: 0 };
    return `
      <div class="util-row">
        <strong>Court ${court}</strong>
        <span>${data.booked} bookings (${data.utilizationPct}%)</span>
        <div class="bar"><div class="bar-fill" style="width:${data.utilizationPct}%"></div></div>
      </div>
    `;
  }).join('');
}

function renderBookings() {
  const q = String(byId('bookingSearch')?.value || '').trim().toLowerCase();
  const body = byId('bookingsTableBody');
  if (!body) {
    return;
  }

  const filtered = state.bookings.filter((booking) => {
    if (!q) {
      return true;
    }

    return [
      booking.customerName,
      booking.customerEmail,
      booking.bookingDate,
      String(booking.courtNumber),
      booking.timeSlot,
    ].join(' ').toLowerCase().includes(q);
  });

  if (!filtered.length) {
    body.innerHTML = '<tr><td colspan="11">No matching bookings found.</td></tr>';
    return;
  }

  body.innerHTML = filtered.map((booking) => {
    const payLabel = booking.paymentMethod === 'card'
      ? `Card ****${booking.cardLast4 || '----'}`
      : (booking.paymentMethod || '-');

    const action = booking.status === 'confirmed'
      ? `<button type="button" class="action-btn" data-booking-id="${booking.id}">Cancel & Refund</button>`
      : '-';

    return `
      <tr>
        <td>${booking.id}</td>
        <td>${booking.bookingDate}</td>
        <td>${booking.courtNumber}</td>
        <td>${booking.timeSlot}</td>
        <td>${booking.customerName || '-'}</td>
        <td>${booking.customerEmail || '-'}</td>
        <td><span class="status-pill ${booking.status}">${booking.status}</span></td>
        <td>${payLabel}</td>
        <td>$${Number(booking.price || 0).toFixed(2)}</td>
        <td>$${Number(booking.refund || 0).toFixed(2)}</td>
        <td>${action}</td>
      </tr>
    `;
  }).join('');
}

function renderCustomers() {
  const q = String(byId('customerSearch')?.value || '').trim().toLowerCase();
  const body = byId('customersTableBody');
  if (!body) {
    return;
  }

  const filtered = state.customers.filter((customer) => {
    if (!q) {
      return true;
    }

    return [
      customer.customerName,
      customer.customerEmail,
      customer.customerPhone,
    ].join(' ').toLowerCase().includes(q);
  });

  if (!filtered.length) {
    body.innerHTML = '<tr><td colspan="8">No matching customers found.</td></tr>';
    return;
  }

  body.innerHTML = filtered.map((customer) => `
    <tr>
      <td>${customer.customerName || '-'}</td>
      <td>${customer.customerEmail || '-'}</td>
      <td>${customer.customerPhone || '-'}</td>
      <td>${customer.totalBookings}</td>
      <td>${customer.active}</td>
      <td>${customer.cancelled}</td>
      <td>$${customer.spend.toFixed(2)}</td>
      <td>$${customer.refund.toFixed(2)}</td>
    </tr>
  `).join('');
}

async function loadOverview() {
  const startDate = byId('startDate')?.value;
  const endDate = byId('endDate')?.value;

  if (!startDate || !endDate) {
    showFlash('Please select both start and end dates.', 'error');
    return;
  }

  const refreshBtn = byId('refreshBtn');
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Loading...';
  }

  try {
    const payload = await apiFetch(`/api/admin/overview?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
    state.bookings = payload.bookings || [];
    state.customers = buildCustomers(state.bookings);

    renderSummary(payload.summary || {});
    renderUtilization(payload.courtUtilization || {});
    renderBookings();
    renderCustomers();
    showFlash(`Loaded ${state.bookings.length} bookings.`, 'success');
  } catch (error) {
    showFlash(error.message || 'Could not load overview.', 'error');
  } finally {
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.textContent = 'Refresh';
    }
  }
}

async function cancelBooking(bookingId) {
  const confirmed = window.confirm('Cancel this booking and process refund simulation?');
  if (!confirmed) {
    return;
  }

  try {
    await apiFetch(`/api/bookings/${bookingId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Cancelled from separate admin portal' }),
    });

    showFlash('Booking cancelled successfully.', 'success');
    await loadOverview();
  } catch (error) {
    showFlash(error.message || 'Could not cancel booking.', 'error');
  }
}

async function ensureAdmin() {
  try {
    const payload = await apiFetch('/api/auth/me');
    const user = payload.user || payload;
    state.me = user;

    const identity = byId('adminIdentity');
    if (identity) {
      identity.textContent = `Signed in as ${user.email || 'unknown user'}`;
    }

    if (user.role !== 'admin') {
      showFlash('Admin access required. Please log in with an admin account.', 'error');
      return false;
    }

    return true;
  } catch (error) {
    window.location.href = '/login.html';
    return false;
  }
}

function bindViewSwitcher() {
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach((item) => {
    item.addEventListener('click', () => {
      menuItems.forEach((btn) => btn.classList.remove('active'));
      item.classList.add('active');

      const selected = item.dataset.view;
      document.querySelectorAll('.view').forEach((view) => view.classList.remove('active'));
      byId(`view-${selected}`)?.classList.add('active');
    });
  });
}

function bindEvents() {
  byId('refreshBtn')?.addEventListener('click', loadOverview);
  byId('bookingSearch')?.addEventListener('input', renderBookings);
  byId('customerSearch')?.addEventListener('input', renderCustomers);

  byId('bookingsTableBody')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-booking-id]');
    if (!button) {
      return;
    }

    cancelBooking(Number(button.dataset.bookingId));
  });

  byId('logoutBtn')?.addEventListener('click', async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/login.html';
    }
  });
}

async function bootstrap() {
  bindViewSwitcher();
  bindEvents();
  setDefaultDates();

  const isAdmin = await ensureAdmin();
  if (!isAdmin) {
    return;
  }

  await loadOverview();
}

document.addEventListener('DOMContentLoaded', bootstrap);
