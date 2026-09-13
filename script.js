/**
 * script.js — Job Application Tracker
 * =========================================================
 * Architecture (modular sections):
 *   1.  State
 *   2.  DOM References
 *   3.  LocalStorage (Persistence)
 *   4.  CRUD Operations
 *   5.  Filter & Search
 *   6.  Dashboard Metrics
 *   7.  Render — card builder & grid render
 *   8.  Modal (Add / Edit)
 *   9.  Delete Confirmation Modal
 *   10. Event Listeners
 *   11. Init
 * =========================================================
 */

"use strict";

// =========================================================
// 1. STATE
// =========================================================

/**
 * @typedef {{ id: number, company: string, position: string,
 *             date: string, salary: string, status: string, notes: string }} Application
 */

/** @type {Application[]} Master list of all applications. */
let applications = [];

/** Active status filter — 'all' | 'Applied' | 'Interview' | 'Offer' | 'Rejected' */
let activeFilter = "all";

/** Live search query string */
let searchQuery = "";

// =========================================================
// 2. DOM REFERENCES
// =========================================================
const appGrid         = document.getElementById("app-grid");
const emptyState      = document.getElementById("empty-state");
const emptyMessage    = document.getElementById("empty-message");
const searchInput     = document.getElementById("search-input");
const filterBtns      = document.querySelectorAll(".filter-btn");

// Dashboard metric counters
const metricTotal     = document.getElementById("metric-total");
const metricActive    = document.getElementById("metric-active");
const metricInterview = document.getElementById("metric-interview");
const metricOffer     = document.getElementById("metric-offer");

// Add / Edit modal
const appModal        = document.getElementById("app-modal");
const modalTitle      = document.getElementById("modal-title");
const appForm         = document.getElementById("app-form");
const formId          = document.getElementById("form-id");
const formCompany     = document.getElementById("form-company");
const formPosition    = document.getElementById("form-position");
const formDate        = document.getElementById("form-date");
const formSalary      = document.getElementById("form-salary");
const formStatus      = document.getElementById("form-status");
const formNotes       = document.getElementById("form-notes");
const openAddModalBtn = document.getElementById("open-add-modal-btn");
const modalCloseBtn   = document.getElementById("modal-close-btn");
const formCancelBtn   = document.getElementById("form-cancel-btn");

// Delete confirmation modal
const confirmModal     = document.getElementById("confirm-modal");
const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
const confirmCancelBtn = document.getElementById("confirm-cancel-btn");

/** ID of the application pending deletion */
let pendingDeleteId = null;

// =========================================================
// 3. LOCALSTORAGE — Persistence
// =========================================================

const STORAGE_KEY = "jobtracker_apps";

/** Load applications from localStorage. */
function loadApplications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    applications = raw ? JSON.parse(raw) : [];
  } catch {
    applications = [];
  }
}

/** Persist current applications array to localStorage. */
function saveApplications() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

// =========================================================
// 4. CRUD OPERATIONS
// =========================================================

/**
 * Add a new application to the list.
 * @param {{ company:string, position:string, date:string, salary:string, status:string, notes:string }} data
 */
function addApplication(data) {
  const app = {
    id:       Date.now(),
    company:  data.company.trim(),
    position: data.position.trim(),
    date:     data.date,
    salary:   data.salary.trim(),
    status:   data.status,
    notes:    data.notes.trim(),
  };
  applications.unshift(app); // newest first
  saveApplications();
}

/**
 * Update an existing application by ID.
 * @param {number} id
 * @param {{ company:string, position:string, date:string, salary:string, status:string, notes:string }} data
 */
function updateApplication(id, data) {
  const idx = applications.findIndex((a) => a.id === id);
  if (idx === -1) return;
  applications[idx] = {
    ...applications[idx],
    company:  data.company.trim(),
    position: data.position.trim(),
    date:     data.date,
    salary:   data.salary.trim(),
    status:   data.status,
    notes:    data.notes.trim(),
  };
  saveApplications();
}

/**
 * Delete an application by ID.
 * @param {number} id
 */
function deleteApplication(id) {
  applications = applications.filter((a) => a.id !== id);
  saveApplications();
}

// =========================================================
// 5. FILTER & SEARCH
// =========================================================

/**
 * Return applications filtered by activeFilter and searchQuery.
 * @returns {Application[]}
 */
function getFilteredApplications() {
  return applications.filter((app) => {
    const matchesFilter =
      activeFilter === "all" || app.status === activeFilter;

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      app.company.toLowerCase().includes(query) ||
      app.position.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });
}

// =========================================================
// 6. DASHBOARD METRICS
// =========================================================

/** Recalculate and update the four metric counters. */
function updateMetrics() {
  const total     = applications.length;
  // "Active" = Applied + Interview (still in progress)
  const active    = applications.filter((a) => a.status === "Applied" || a.status === "Interview").length;
  const interview = applications.filter((a) => a.status === "Interview").length;
  const offer     = applications.filter((a) => a.status === "Offer").length;

  animateCounter(metricTotal,     parseInt(metricTotal.textContent)     || 0, total);
  animateCounter(metricActive,    parseInt(metricActive.textContent)    || 0, active);
  animateCounter(metricInterview, parseInt(metricInterview.textContent) || 0, interview);
  animateCounter(metricOffer,     parseInt(metricOffer.textContent)     || 0, offer);
}

/**
 * Briefly animate a numeric counter from `from` to `to`.
 * @param {HTMLElement} el
 * @param {number} from
 * @param {number} to
 */
function animateCounter(el, from, to) {
  if (from === to) { el.textContent = to; return; }
  const duration  = 350; // ms
  const startTime = performance.now();
  function step(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    el.textContent = Math.round(from + (to - from) * progress);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// =========================================================
// 7. RENDER — card builder & grid
// =========================================================

/**
 * Return the CSS class for a status badge.
 * @param {string} status
 * @returns {string}
 */
function getBadgeClass(status) {
  const map = {
    Applied:   "badge-applied",
    Interview: "badge-interview",
    Offer:     "badge-offer",
    Rejected:  "badge-rejected",
  };
  return map[status] || "badge-applied";
}

/**
 * Format an ISO date string (YYYY-MM-DD) to a readable format.
 * @param {string} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Build a single application card element.
 * @param {Application} app
 * @returns {HTMLDivElement}
 */
function createCard(app) {
  const card = document.createElement("div");
  card.className = "app-card";
  card.dataset.id     = app.id;
  card.dataset.status = app.status;

  card.innerHTML = `
    <!-- Card Header -->
    <div class="flex items-start justify-between gap-2 pl-3">
      <div class="min-w-0">
        <h3 class="text-base font-bold text-gray-800 truncate">${escapeHtml(app.company)}</h3>
        <p class="text-sm text-gray-500 truncate">${escapeHtml(app.position)}</p>
      </div>
      <span class="status-badge ${getBadgeClass(app.status)} flex-shrink-0">${escapeHtml(app.status)}</span>
    </div>

    <!-- Card Details -->
    <div class="pl-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
      <div class="flex items-center gap-1.5">
        <!-- Calendar icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        <span>${formatDate(app.date)}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <!-- Salary icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-2.21 0-4 .895-4 2s1.79 2 4 2 4 .895 4 2-1.79 2-4 2m0-8c2.21 0 4 .895 4 2M12 8V6m0 12v-2"/>
        </svg>
        <span class="truncate">${app.salary ? escapeHtml(app.salary) : "Not specified"}</span>
      </div>
    </div>

    ${app.notes ? `
    <!-- Notes snippet -->
    <p class="pl-3 text-xs text-gray-400 italic line-clamp-2">${escapeHtml(app.notes)}</p>
    ` : ""}

    <!-- Card Actions -->
    <div class="pl-3 flex items-center justify-end gap-2 pt-1 border-t border-gray-50">
      <button data-action="edit" data-id="${app.id}"
        class="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2.5 py-1.5 rounded-lg transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z"/>
        </svg>
        Edit
      </button>
      <button data-action="delete" data-id="${app.id}"
        class="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/>
        </svg>
        Delete
      </button>
    </div>
  `;

  return card;
}

/**
 * Full re-render: clear the grid and rebuild from filtered results.
 * Also refreshes metrics and empty state.
 */
function render() {
  const filtered = getFilteredApplications();

  // Clear grid
  appGrid.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
    emptyState.classList.add("flex");
    emptyMessage.textContent =
      applications.length === 0
        ? 'No applications yet. Click "Add Application" to start!'
        : "No applications match your current filter or search.";
  } else {
    emptyState.classList.add("hidden");
    emptyState.classList.remove("flex");
    filtered.forEach((app) => appGrid.appendChild(createCard(app)));
  }

  updateMetrics();
}

// =========================================================
// 8. ADD / EDIT MODAL
// =========================================================

/** Clear all form fields and validation states. */
function resetForm() {
  appForm.reset();
  formId.value = "";
  // Clear error states
  appForm.querySelectorAll(".form-input").forEach((el) => el.classList.remove("error"));
  appForm.querySelectorAll(".form-error").forEach((el) => el.classList.add("hidden"));
}

/** Open modal in "Add" mode. */
function openAddModal() {
  resetForm();
  modalTitle.textContent = "Add Application";
  // Default date to today
  formDate.value = new Date().toISOString().split("T")[0];
  appModal.classList.remove("hidden");
  requestAnimationFrame(() => formCompany.focus());
}

/**
 * Open modal in "Edit" mode pre-filled with existing data.
 * @param {number} id - Application ID to edit.
 */
function openEditModal(id) {
  const app = applications.find((a) => a.id === id);
  if (!app) return;

  resetForm();
  modalTitle.textContent = "Edit Application";
  formId.value          = app.id;
  formCompany.value     = app.company;
  formPosition.value    = app.position;
  formDate.value        = app.date;
  formSalary.value      = app.salary;
  formStatus.value      = app.status;
  formNotes.value       = app.notes;

  appModal.classList.remove("hidden");
  requestAnimationFrame(() => formCompany.focus());
}

/** Close the add/edit modal without saving. */
function closeAppModal() {
  appModal.classList.add("hidden");
  resetForm();
}

/**
 * Validate the form.
 * @returns {boolean} true if valid.
 */
function validateForm() {
  let valid = true;

  const required = [
    { input: formCompany,  error: formCompany.nextElementSibling },
    { input: formPosition, error: formPosition.nextElementSibling },
    { input: formDate,     error: formDate.nextElementSibling },
  ];

  required.forEach(({ input, error }) => {
    if (!input.value.trim()) {
      input.classList.add("error");
      error.classList.remove("hidden");
      valid = false;
    } else {
      input.classList.remove("error");
      error.classList.add("hidden");
    }
  });

  return valid;
}

/** Handle form submission (both add and edit). */
function handleFormSubmit(e) {
  e.preventDefault();

  if (!validateForm()) return;

  const data = {
    company:  formCompany.value,
    position: formPosition.value,
    date:     formDate.value,
    salary:   formSalary.value,
    status:   formStatus.value,
    notes:    formNotes.value,
  };

  const id = formId.value ? parseInt(formId.value, 10) : null;

  if (id) {
    updateApplication(id, data);
  } else {
    addApplication(data);
  }

  closeAppModal();
  render();
}

// =========================================================
// 9. DELETE CONFIRMATION MODAL
// =========================================================

/**
 * Show the delete confirmation modal for a given application.
 * @param {number} id
 */
function openConfirmModal(id) {
  pendingDeleteId = id;
  confirmModal.classList.remove("hidden");
}

/** Close the delete confirmation modal without deleting. */
function closeConfirmModal() {
  confirmModal.classList.add("hidden");
  pendingDeleteId = null;
}

/**
 * Execute the pending deletion with a card fade-out animation.
 */
function handleConfirmDelete() {
  if (pendingDeleteId === null) return;

  const card = appGrid.querySelector(`[data-id="${pendingDeleteId}"]`);
  closeConfirmModal();

  if (card) {
    // Animate card out, then remove from state
    card.classList.add("card-removing");
    setTimeout(() => {
      deleteApplication(pendingDeleteId);
      pendingDeleteId = null;
      render();
    }, 220);
  } else {
    deleteApplication(pendingDeleteId);
    pendingDeleteId = null;
    render();
  }
}

// =========================================================
// 10. EVENT LISTENERS
// =========================================================

// Header "Add Application" button
openAddModalBtn.addEventListener("click", openAddModal);

// Modal close / cancel buttons
modalCloseBtn.addEventListener("click", closeAppModal);
formCancelBtn.addEventListener("click", closeAppModal);

// Close add/edit modal when clicking the backdrop
appModal.addEventListener("click", (e) => {
  if (e.target === appModal) closeAppModal();
});

// Form submission
appForm.addEventListener("submit", handleFormSubmit);

// Clear field error on input
[formCompany, formPosition, formDate].forEach((input) => {
  input.addEventListener("input", () => {
    if (input.value.trim()) {
      input.classList.remove("error");
      if (input.nextElementSibling) {
        input.nextElementSibling.classList.add("hidden");
      }
    }
  });
});

// Delete confirmation modal buttons
confirmDeleteBtn.addEventListener("click", handleConfirmDelete);
confirmCancelBtn.addEventListener("click", closeConfirmModal);

// Close confirm modal on backdrop click
confirmModal.addEventListener("click", (e) => {
  if (e.target === confirmModal) closeConfirmModal();
});

// Keyboard: Escape closes any open modal
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!appModal.classList.contains("hidden"))     closeAppModal();
  if (!confirmModal.classList.contains("hidden")) closeConfirmModal();
});

// Event delegation for Edit / Delete buttons inside cards
appGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const id     = parseInt(btn.dataset.id, 10);
  const action = btn.dataset.action;

  if (action === "edit")   openEditModal(id);
  if (action === "delete") openConfirmModal(id);
});

// Filter buttons
filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    activeFilter = btn.dataset.filter;
    filterBtns.forEach((b) => b.classList.toggle("active-filter", b === btn));
    render();
  });
});

// Live search — debounced for performance
let searchTimer = null;
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery = searchInput.value;
    render();
  }, 200); // 200ms debounce
});

// =========================================================
// 11. INIT
// =========================================================

/**
 * Helper: escape HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Bootstrap the application. */
function init() {
  loadApplications();
  render();
}

init();
