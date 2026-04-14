const state = {
  currentDate: new Date(),
  selectedCourt: null,
  selectedTimeSlot: null,
  bookings: [],
  myBookings: [],
  me: null,
  adminOverview: null,
  demoMode: false,
  demoNoticeShown: false,
};

const courtPrices = {
  1: 50,
  2: 50,
  3: 40,
  4: 40,
  5: 70,
};

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00",
];

const byId = (id) => document.getElementById(id);
const hasElement = (id) => Boolean(byId(id));

const isMissingFeatureApi = (error) => error && error.status === 404;

function enableDemoMode() {
  state.demoMode = true;
  if (!state.demoNoticeShown) {
    state.demoNoticeShown = true;
    showNotification("Booking features are running in demo mode.", "error");
  }
}

function getCurrentDateBookingsFromLocalState() {
  const dateKey = getDateKey(state.currentDate);
  return state.myBookings
    .filter((booking) => booking.bookingDate === dateKey && booking.status !== "cancelled")
    .map((booking) => ({
      ...booking,
      isMine: true,
    }));
}

function buildAdminOverviewFromLocalState(startDate, endDate) {
  const filtered = state.myBookings.filter(
    (booking) => booking.bookingDate >= startDate && booking.bookingDate <= endDate
  );

  const activeBookings = filtered.filter((booking) => booking.status !== "cancelled");
  const cancelledBookings = filtered.filter((booking) => booking.status === "cancelled");
  const grossRevenue = filtered.reduce((sum, booking) => sum + Number(booking.price || 0), 0);
  const refunded = filtered.reduce((sum, booking) => sum + Number(booking.refund || 0), 0);
  const netRevenue = grossRevenue - refunded;

  const courtUtilization = {};
  for (let court = 1; court <= 5; court += 1) {
    const courtBooked = activeBookings.filter((booking) => booking.courtNumber === court).length;
    courtUtilization[court] = {
      booked: courtBooked,
      utilizationPct: Number(((courtBooked / timeSlots.length) * 100).toFixed(1)),
    };
  }

  return {
    summary: {
      totalBookings: filtered.length,
      activeBookings: activeBookings.length,
      cancelledBookings: cancelledBookings.length,
      grossRevenue,
      refunded,
      netRevenue,
    },
    courtUtilization,
    bookings: filtered,
  };
}

function getDateKey(date) {
  return date.toISOString().split("T")[0];
}

function formatLongDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isAdminUser() {
  return state.me && state.me.role === "admin";
}

function showNotification(message, type = "success") {
  const existing = document.querySelector(".notification");
  if (existing) {
    existing.remove();
  }

  const box = document.createElement("div");
  box.className = `notification ${type}`;
  box.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${type === "success" ? "check-circle" : "exclamation-circle"}"></i>
      <span>${message}</span>
    </div>
  `;

  if (!document.querySelector("style[data-notification-style]")) {
    const style = document.createElement("style");
    style.setAttribute("data-notification-style", "true");
    style.textContent = `
      .notification {
        position: fixed;
        top: 90px;
        right: 20px;
        background: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.2);
        z-index: 4000;
        animation: slideInRight 0.3s ease;
      }
      .notification.success { border-left: 4px solid #00b894; }
      .notification.error { border-left: 4px solid #ff7675; }
      .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
      }
      @keyframes slideInRight {
        from { transform: translateX(300px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(300px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(box);
  setTimeout(() => {
    box.style.animation = "slideOutRight 0.25s ease";
    setTimeout(() => box.remove(), 250);
  }, 2600);
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
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
    const message = payload.message || "Request failed.";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function ensureAuthenticated() {
  try {
    const me = await apiFetch("/api/auth/me");
    state.me = me.user || me;
  } catch (error) {
    if (error.status === 401) {
      window.location.href = "/login.html";
      return;
    }
    throw error;
  }
}

function updateDateDisplay() {
  const el = byId("currentDate");
  if (!el) {
    return;
  }

  const todayKey = getDateKey(new Date());
  const currentKey = getDateKey(state.currentDate);
  el.textContent = currentKey === todayKey
    ? `Today - ${formatLongDate(state.currentDate)}`
    : formatLongDate(state.currentDate);
}

function getCourtBookings(courtNumber) {
  return state.bookings.filter((booking) => booking.courtNumber === courtNumber);
}

function isSlotBooked(courtNumber, timeSlot) {
  return state.bookings.some(
    (booking) => booking.courtNumber === courtNumber && booking.timeSlot === timeSlot
  );
}

function updateStats() {
  if (!hasElement("availableSlots") || !hasElement("totalBookings")) {
    return;
  }

  const totalBooked = state.bookings.length;
  const available = 5 * timeSlots.length - totalBooked;

  byId("availableSlots").textContent = String(available);
  byId("totalBookings").textContent = String(totalBooked);
}

function generateTimeline() {
  const container = byId("timelineContent");
  if (!container) {
    return;
  }

  container.innerHTML = "";

  for (let court = 1; court <= 5; court++) {
    const row = document.createElement("div");
    row.className = "timeline-row";

    const courtName = document.createElement("div");
    courtName.className = "timeline-court-name";
    courtName.innerHTML = `<i class="fas fa-futbol"></i> Court ${court}`;

    const slots = document.createElement("div");
    slots.className = "timeline-slots";

    for (const slot of timeSlots) {
      const slotEl = document.createElement("div");
      slotEl.className = "timeline-slot";

      const match = state.bookings.find(
        (booking) => booking.courtNumber === court && booking.timeSlot === slot
      );

      if (match) {
        slotEl.classList.add("booked");
        if (match.isMine) {
          slotEl.classList.add("mine");
        }
        slotEl.title = `${match.customerName} (${match.paymentStatus})`;
      } else {
        slotEl.title = `Available at ${slot}`;
      }

      slots.appendChild(slotEl);
    }

    row.appendChild(courtName);
    row.appendChild(slots);
    container.appendChild(row);
  }
}

function updateSummary() {
  if (!hasElement("summaryCourtNumber") || !hasElement("summaryTimeSlot") || !hasElement("summaryPrice")) {
    return;
  }

  byId("summaryCourtNumber").textContent = state.selectedCourt
    ? `Court ${state.selectedCourt}`
    : "-";
  byId("summaryTimeSlot").textContent = state.selectedTimeSlot || "Not selected";
  byId("summaryPrice").textContent = state.selectedCourt
    ? `$${courtPrices[state.selectedCourt]}`
    : "$0";
}

function generateTimeSlots(courtNumber) {
  const container = byId("timeSlots");
  if (!container) {
    return;
  }

  container.innerHTML = "";

  for (const slot of timeSlots) {
    const div = document.createElement("div");
    div.className = "time-slot";
    div.textContent = slot;

    if (isSlotBooked(courtNumber, slot)) {
      div.classList.add("booked");
      const booking = getCourtBookings(courtNumber).find((entry) => entry.timeSlot === slot);
      div.title = booking ? `Booked by ${booking.customerName}` : "Booked";
    } else {
      div.addEventListener("click", () => {
        state.selectedTimeSlot = slot;
        document.querySelectorAll(".time-slot").forEach((el) => el.classList.remove("selected"));
        div.classList.add("selected");
        updateSummary();
      });
    }

    container.appendChild(div);
  }
}

function toggleCardFields() {
  const paymentMethod = byId("paymentMethod");
  const cardGroup = byId("cardNumberGroup");
  const cardNumber = byId("cardNumber");

  if (!paymentMethod || !cardGroup || !cardNumber) {
    return;
  }

  const isCard = paymentMethod.value === "card";
  cardGroup.style.display = isCard ? "block" : "none";
  cardNumber.required = isCard;
  if (!isCard) {
    cardNumber.value = "";
  }
}

async function loadBookingsForCurrentDate() {
  const dateKey = getDateKey(state.currentDate);
  try {
    const payload = await apiFetch(`/api/bookings?date=${encodeURIComponent(dateKey)}`);
    state.bookings = payload.bookings || [];
  } catch (error) {
    if (!isMissingFeatureApi(error)) {
      throw error;
    }
    enableDemoMode();
    state.bookings = getCurrentDateBookingsFromLocalState();
  }
}

async function loadMyBookings() {
  const panel = byId("myBookingsList");
  if (!panel) {
    return;
  }

  try {
    const payload = await apiFetch("/api/bookings/mine");
    state.myBookings = payload.bookings || [];
  } catch (error) {
    if (!isMissingFeatureApi(error)) {
      throw error;
    }
    enableDemoMode();
    if (!Array.isArray(state.myBookings)) {
      state.myBookings = [];
    }
  }

  if (!state.myBookings.length) {
    panel.innerHTML = `<p class="empty-my-bookings">No bookings yet. Book a court to see your payment history here.</p>`;
    return;
  }

  panel.innerHTML = state.myBookings
    .map((booking) => {
      const paymentInfo = booking.paymentMethod === "card"
        ? `Card ****${booking.cardLast4 || "----"}`
        : "Cash at venue";
      const isCancelled = booking.status === "cancelled";
      const refundText = (booking.refund || 0) > 0 ? `$${booking.refund.toFixed(2)} refunded` : "No refund";
      return `
        <article class="my-booking-card">
          <h4>Court ${booking.courtNumber} - ${booking.bookingDate} ${booking.timeSlot}</h4>
          <p><strong>Name:</strong> ${booking.customerName}</p>
          <p><strong>Phone:</strong> ${booking.customerPhone}</p>
          <p><strong>Amount:</strong> $${booking.price.toFixed(2)}</p>
          <p><strong>Payment:</strong> ${paymentInfo}</p>
          <p><strong>Booking Status:</strong> ${booking.status}</p>
          ${isCancelled ? `<p><strong>Refund:</strong> ${refundText}</p>` : ""}
          ${booking.cancelReason ? `<p><strong>Reason:</strong> ${booking.cancelReason}</p>` : ""}
          <span class="status-pill ${booking.paymentStatus}">${booking.paymentStatus}</span>
          ${!isCancelled ? `<button class="cancel-booking-btn" type="button" data-booking-id="${booking.id}"><i class="fas fa-undo"></i> Cancel & Refund</button>` : ""}
        </article>
      `;
    })
    .join("");
}

function openModal() {
  const modal = byId("bookingModal");
  if (!modal) {
    return;
  }

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = byId("bookingModal");
  if (!modal) {
    return;
  }

  modal.classList.remove("active");
  document.body.style.overflow = "auto";
  state.selectedCourt = null;
  state.selectedTimeSlot = null;
}

async function selectCourt(courtNumber) {
  state.selectedCourt = Number(courtNumber);
  state.selectedTimeSlot = null;

  const modalCourt = byId("modalCourtNumber");
  if (modalCourt) {
    modalCourt.textContent = String(courtNumber);
  }

  if (hasElement("customerName")) {
    byId("customerName").value = "";
  }
  if (hasElement("customerPhone")) {
    byId("customerPhone").value = "";
  }
  if (hasElement("customerEmail")) {
    byId("customerEmail").value = state.me ? state.me.email : "";
    byId("customerEmail").readOnly = true;
  }

  if (hasElement("paymentMethod")) {
    byId("paymentMethod").value = "card";
    toggleCardFields();
  }

  updateSummary();
  generateTimeSlots(state.selectedCourt);
  openModal();
}

function attachLogoutAction() {
  const nav = document.querySelector(".nav");
  if (!nav || nav.querySelector(".logout-link")) {
    return;
  }

  const logout = document.createElement("a");
  logout.href = "#";
  logout.className = "nav-link logout-link";
  logout.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';

  logout.addEventListener("click", async (event) => {
    event.preventDefault();
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login.html";
    }
  });

  nav.appendChild(logout);

  if (isAdminUser() && !nav.querySelector('.admin-link')) {
    const admin = document.createElement("a");
    admin.href = "/admin.html";
    admin.className = "nav-link admin-link";
    admin.innerHTML = '<i class="fas fa-user-shield"></i> Admin';
    nav.insertBefore(admin, logout);
  }
}

async function cancelBooking(bookingId) {
  const ok = window.confirm("Cancel this booking and simulate full refund?");
  if (!ok) {
    return;
  }

  try {
    await apiFetch(`/api/bookings/${bookingId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason: "Cancelled from customer portal" }),
    });

    await loadBookingsForCurrentDate();
    await loadMyBookings();
    updateStats();
    generateTimeline();
    showNotification("Booking cancelled and refund simulated.", "success");
  } catch (error) {
    if (!isMissingFeatureApi(error)) {
      showNotification(error.message || "Could not cancel booking.", "error");
      return;
    }

    enableDemoMode();
    const booking = state.myBookings.find((entry) => entry.id === bookingId);
    if (!booking || booking.status === "cancelled") {
      showNotification("Could not cancel booking.", "error");
      return;
    }

    booking.status = "cancelled";
    booking.paymentStatus = "refunded";
    booking.refund = Number(booking.price || 0);
    booking.cancelReason = "Cancelled from customer portal";

    state.bookings = getCurrentDateBookingsFromLocalState();
    await loadMyBookings();
    updateStats();
    generateTimeline();
    showNotification("Booking cancelled (demo mode).", "success");
  }
}

async function cancelBookingAsAdmin(bookingId) {
  const reason = window.prompt("Cancellation reason:", "Cancelled by admin dashboard") || "Cancelled by admin dashboard";
  try {
    await apiFetch(`/api/bookings/${bookingId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    await loadAdminOverview();
    showNotification("Booking cancelled from admin dashboard.", "success");
  } catch (error) {
    if (!isMissingFeatureApi(error)) {
      showNotification(error.message || "Admin cancellation failed.", "error");
      return;
    }

    enableDemoMode();
    const booking = state.myBookings.find((entry) => entry.id === bookingId);
    if (!booking || booking.status === "cancelled") {
      showNotification("Admin cancellation failed.", "error");
      return;
    }

    booking.status = "cancelled";
    booking.paymentStatus = "refunded";
    booking.refund = Number(booking.price || 0);
    booking.cancelReason = reason;
    await loadAdminOverview();
    showNotification("Admin cancellation applied (demo mode).", "success");
  }
}

function bindCourtBookingButtons() {
  document.querySelectorAll("[data-court]").forEach((button) => {
    button.addEventListener("click", () => {
      const courtNumber = Number(button.dataset.court);
      if (courtNumber) {
        selectCourt(courtNumber);
      }
    });
  });
}

function bindStaticActionButtons() {
  byId("bookingCloseBtn")?.addEventListener("click", closeModal);
  byId("bookingConfirmBtn")?.addEventListener("click", confirmBooking);
  byId("bookingRefreshBtn")?.addEventListener("click", refreshBookings);
  byId("adminRefreshBtn")?.addEventListener("click", loadAdminOverview);
  byId("adminExportBtn")?.addEventListener("click", exportAdminCsv);
}

function bindDelegatedActionButtons() {
  const myBookingsList = byId("myBookingsList");
  if (myBookingsList) {
    myBookingsList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-booking-id]");
      if (!button) {
        return;
      }

      cancelBooking(Number(button.dataset.bookingId));
    });
  }

  const adminBookingsTableBody = byId("adminBookingsTableBody");
  if (adminBookingsTableBody) {
    adminBookingsTableBody.addEventListener("click", (event) => {
      const button = event.target.closest("[data-admin-booking-id]");
      if (!button) {
        return;
      }

      cancelBookingAsAdmin(Number(button.dataset.adminBookingId));
    });
  }
}

async function confirmBooking() {
  const name = hasElement("customerName") ? byId("customerName").value.trim() : "";
  const phone = hasElement("customerPhone") ? byId("customerPhone").value.trim() : "";
  const email = hasElement("customerEmail") ? byId("customerEmail").value.trim() : "";
  const paymentMethod = hasElement("paymentMethod") ? byId("paymentMethod").value : "card";
  const cardNumber = hasElement("cardNumber") ? byId("cardNumber").value.trim() : "";

  if (!state.selectedCourt) {
    showNotification("Please select a court.", "error");
    return;
  }

  if (!state.selectedTimeSlot) {
    showNotification("Please select a time slot.", "error");
    return;
  }

  if (!name) {
    showNotification("Please enter your name.", "error");
    return;
  }

  if (!phone) {
    showNotification("Please enter your phone number.", "error");
    return;
  }

  if (!email) {
    showNotification("Missing customer email.", "error");
    return;
  }

  if (paymentMethod === "card") {
    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 12 || digits.length > 19) {
      showNotification("Please enter a valid card number.", "error");
      return;
    }
  }

  const payload = {
    courtNumber: state.selectedCourt,
    bookingDate: getDateKey(state.currentDate),
    timeSlot: state.selectedTimeSlot,
    customerName: name,
    customerPhone: phone,
    paymentMethod,
    cardNumber,
  };

  const btn = document.querySelector(".btn-confirm");
  const originalText = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  }

  try {
    await apiFetch("/api/bookings/checkout", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    await loadBookingsForCurrentDate();
    await loadMyBookings();
    updateStats();
    generateTimeline();
    closeModal();
    showNotification("Booking confirmed and payment completed.", "success");
  } catch (error) {
    if (!isMissingFeatureApi(error)) {
      showNotification(error.message || "Unable to complete checkout.", "error");
      return;
    }

    enableDemoMode();

    const simulatedBooking = {
      id: Date.now(),
      bookingDate: getDateKey(state.currentDate),
      courtNumber: state.selectedCourt,
      timeSlot: state.selectedTimeSlot,
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      status: "confirmed",
      paymentStatus: "paid",
      paymentMethod,
      cardLast4: paymentMethod === "card" ? cardNumber.replace(/\D/g, "").slice(-4) : null,
      price: courtPrices[state.selectedCourt],
      refund: 0,
      cancelReason: "",
      isMine: true,
    };

    state.myBookings.unshift(simulatedBooking);
    state.bookings = getCurrentDateBookingsFromLocalState();
    await loadMyBookings();
    updateStats();
    generateTimeline();
    closeModal();
    showNotification("Booking saved in demo mode.", "success");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }
}

async function refreshBookings() {
  const icon = document.querySelector(".btn-refresh i");
  if (icon) {
    icon.style.animation = "spin 0.7s linear";
  }

  try {
    await loadBookingsForCurrentDate();
    await loadMyBookings();
    updateStats();
    generateTimeline();
    showNotification("Bookings refreshed.", "success");
  } catch (error) {
    showNotification(error.message || "Could not refresh bookings.", "error");
  } finally {
    if (icon) {
      setTimeout(() => {
        icon.style.animation = "";
      }, 700);
    }
  }
}

function bindDateNavigation() {
  const prev = byId("prevDate");
  const next = byId("nextDate");

  if (prev) {
    prev.addEventListener("click", async () => {
      state.currentDate.setDate(state.currentDate.getDate() - 1);
      updateDateDisplay();
      await refreshBookings();
    });
  }

  if (next) {
    next.addEventListener("click", async () => {
      state.currentDate.setDate(state.currentDate.getDate() + 1);
      updateDateDisplay();
      await refreshBookings();
    });
  }
}

function bindModalBehavior() {
  const modal = byId("bookingModal");
  if (!modal) {
    return;
  }

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("active")) {
      closeModal();
    }
  });

  const paymentMethod = byId("paymentMethod");
  if (paymentMethod) {
    paymentMethod.addEventListener("change", toggleCardFields);
  }

  const cardNumber = byId("cardNumber");
  if (cardNumber) {
    cardNumber.addEventListener("input", () => {
      const digits = cardNumber.value.replace(/\D/g, "").slice(0, 19);
      cardNumber.value = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
    });
  }
}

function animateCourtCards() {
  const cards = document.querySelectorAll(".court-card");
  if (!cards.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    },
    { threshold: 0.1 }
  );

  cards.forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(24px)";
    card.style.transition = `all 0.45s ease ${index * 0.08}s`;
    observer.observe(card);
  });
}

function initializeAdminDateDefaults() {
  const startEl = byId("adminStartDate");
  const endEl = byId("adminEndDate");
  if (!startEl || !endEl) {
    return;
  }

  const today = getDateKey(new Date());
  startEl.value = today;
  endEl.value = today;
}

function renderAdminOverview(payload) {
  if (!payload) {
    return;
  }

  state.adminOverview = payload;

  const summary = payload.summary || {};
  const utilization = payload.courtUtilization || {};
  const bookings = payload.bookings || [];

  if (hasElement("adminTotalBookings")) byId("adminTotalBookings").textContent = String(summary.totalBookings || 0);
  if (hasElement("adminActiveBookings")) byId("adminActiveBookings").textContent = String(summary.activeBookings || 0);
  if (hasElement("adminCancelledBookings")) byId("adminCancelledBookings").textContent = String(summary.cancelledBookings || 0);
  if (hasElement("adminGrossRevenue")) byId("adminGrossRevenue").textContent = `$${Number(summary.grossRevenue || 0).toFixed(2)}`;
  if (hasElement("adminRefunded")) byId("adminRefunded").textContent = `$${Number(summary.refunded || 0).toFixed(2)}`;
  if (hasElement("adminNetRevenue")) byId("adminNetRevenue").textContent = `$${Number(summary.netRevenue || 0).toFixed(2)}`;

  const utilList = byId("adminUtilizationList");
  if (utilList) {
    utilList.innerHTML = [1, 2, 3, 4, 5].map((court) => {
      const courtData = utilization[court] || { booked: 0, utilizationPct: 0 };
      return `
        <div class="utilization-row">
          <div class="utilization-meta">
            <strong>Court ${court}</strong>
            <span>${courtData.booked} bookings (${courtData.utilizationPct}%)</span>
          </div>
          <div class="utilization-bar">
            <div class="utilization-fill" style="width:${courtData.utilizationPct}%"></div>
          </div>
        </div>
      `;
    }).join("");
  }

  const tableBody = byId("adminBookingsTableBody");
  if (tableBody) {
    if (!bookings.length) {
      tableBody.innerHTML = `<tr><td colspan="10">No records for selected period.</td></tr>`;
      return;
    }

    tableBody.innerHTML = bookings.map((booking) => {
      const payLabel = booking.paymentMethod === "card"
        ? `Card ****${booking.cardLast4 || "----"}`
        : (booking.paymentMethod || "-");
      const action = booking.status === "confirmed"
        ? `<button class="admin-action-btn" type="button" data-admin-booking-id="${booking.id}">Cancel/Refund</button>`
        : "-";
      return `
        <tr>
          <td>${booking.id}</td>
          <td>${booking.bookingDate}</td>
          <td>${booking.courtNumber}</td>
          <td>${booking.timeSlot}</td>
          <td>${booking.customerName}</td>
          <td>${booking.status}</td>
          <td>${booking.paymentStatus} (${payLabel})</td>
          <td>$${Number(booking.price || 0).toFixed(2)}</td>
          <td>$${Number(booking.refund || 0).toFixed(2)}</td>
          <td>${action}</td>
        </tr>
      `;
    }).join("");
  }
}

function exportAdminCsv() {
  if (!state.adminOverview || !Array.isArray(state.adminOverview.bookings)) {
    showNotification("Load admin data before exporting.", "error");
    return;
  }

  const rows = state.adminOverview.bookings;
  const headers = [
    "id",
    "bookingDate",
    "courtNumber",
    "timeSlot",
    "customerName",
    "customerPhone",
    "customerEmail",
    "status",
    "paymentStatus",
    "paymentMethod",
    "price",
    "refund",
    "cancelReason",
  ];

  const escapeCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csvLines = [headers.join(",")];

  rows.forEach((row) => {
    csvLines.push([
      row.id,
      row.bookingDate,
      row.courtNumber,
      row.timeSlot,
      row.customerName,
      row.customerPhone,
      row.customerEmail,
      row.status,
      row.paymentStatus,
      row.paymentMethod || "",
      Number(row.price || 0).toFixed(2),
      Number(row.refund || 0).toFixed(2),
      row.cancelReason || "",
    ].map(escapeCell).join(","));
  });

  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `admin-overview-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function loadAdminOverview() {
  const startEl = byId("adminStartDate");
  const endEl = byId("adminEndDate");
  if (!startEl || !endEl) {
    return;
  }

  const startDate = startEl.value;
  const endDate = endEl.value;
  if (!startDate || !endDate) {
    showNotification("Please choose both dates.", "error");
    return;
  }

  const btn = byId("adminRefreshBtn");
  const original = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
  }

  try {
    const payload = await apiFetch(`/api/admin/overview?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
    renderAdminOverview(payload);
  } catch (error) {
    if (!isMissingFeatureApi(error)) {
      showNotification(error.message || "Could not load admin overview.", "error");
      return;
    }

    enableDemoMode();
    const payload = buildAdminOverviewFromLocalState(startDate, endDate);
    renderAdminOverview(payload);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = original;
    }
  }
}

async function bootstrap() {
  try {
    await ensureAuthenticated();

    if (hasElement("adminDashboard") && !isAdminUser()) {
      showNotification("Admin access required.", "error");
      window.location.href = "/index.html";
      return;
    }

    attachLogoutAction();
    bindCourtBookingButtons();
    bindStaticActionButtons();
    bindDelegatedActionButtons();
    bindDateNavigation();
    bindModalBehavior();

    if (hasElement("adminDashboard")) {
      initializeAdminDateDefaults();
      await loadAdminOverview();
      return;
    }

    updateDateDisplay();
    await loadBookingsForCurrentDate();
    await loadMyBookings();
    updateStats();
    generateTimeline();
    animateCourtCards();
  } catch (error) {
    showNotification(error.message || "System failed to initialize.", "error");
  }
}

document.addEventListener("DOMContentLoaded", bootstrap);

window.selectCourt = selectCourt;
window.closeModal = closeModal;
window.confirmBooking = confirmBooking;
window.refreshBookings = refreshBookings;
window.cancelBooking = cancelBooking;
window.loadAdminOverview = loadAdminOverview;
window.cancelBookingAsAdmin = cancelBookingAsAdmin;
window.exportAdminCsv = exportAdminCsv;
