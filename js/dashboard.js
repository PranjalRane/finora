/**
 * ========================================================
 * FINORA – Main Dashboard Controller & UI Integration
 * ========================================================
 */

// Rotating Financial Quotes
const FINANCIAL_QUOTES = [
  "A budget is telling your money where to go instead of wondering where it went. — Dave Ramsey",
  "Do not save what is left after spending, but spend what is left after saving. — Warren Buffett",
  "Beware of little expenses; a small leak will sink a great ship. — Benjamin Franklin",
  "Know what you own, and know why you own it. — Peter Lynch",
  "The goal isn’t more money. The goal is living life on your terms. — Chris Brogan",
  "Financial freedom is available to those who learn about it and work for it. — Robert Kiyosaki"
];

// Active State
let currentUser = null;
let activeTab = 'overview';
let activeTxnType = 'expense';
let editingTxnId = null;
let deletingTxnId = null;

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Route guard & user session check
  currentUser = await protectDashboardPage();
  if (!currentUser) return;

  // 2. Set up user info and date
  setupUserInfo();
  setupCurrentDate();
  setupQuote();

  // 3. Check configuration banner
  setupConfigBanner();

  // 4. Initialize Category dropdowns
  populateCategorySelect('txnCategory', activeTxnType);
  populateCategorySelect('editTxnCategory', 'expense');

  // 5. Initialize Navigation tabs
  setupNavigation();

  // 6. Initialize Form Handlers & Modals
  setupQuickForm();
  setupEditForm();
  setupSearchAndFilters();
  setupMobileDrawer();

  // 7. Load transactions and refresh UI
  await refreshDashboardData();
});

/**
 * Display User Details in Topbar & Sidebar
 */
function setupUserInfo() {
  if (!currentUser) return;
  const userNameEl = document.getElementById('sidebarUserName');
  const userEmailEl = document.getElementById('sidebarUserEmail');
  const userGreetingEl = document.getElementById('welcomeUserName');
  const avatarEl = document.getElementById('sidebarUserAvatar');

  const displayName = (currentUser.fullName && currentUser.fullName.trim()) 
    ? currentUser.fullName.trim() 
    : (currentUser.email ? currentUser.email.split('@')[0] : 'Finora User');

  if (userNameEl) userNameEl.textContent = displayName;
  if (userEmailEl) userEmailEl.textContent = currentUser.email || '';
  if (userGreetingEl) userGreetingEl.textContent = displayName;

  if (avatarEl) {
    const parts = displayName.split(/\s+/).filter(Boolean);
    const initials = parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : displayName.substring(0, 2).toUpperCase() || 'U';
    avatarEl.textContent = initials;
  }
}

/**
 * Setup Current Formatted Date
 */
function setupCurrentDate() {
  const dateEl = document.getElementById('currentDateDisplay');
  if (dateEl) {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-US', options);
  }
}

/**
 * Setup Financial Quote Rotator
 */
function setupQuote() {
  const quoteEl = document.getElementById('financialQuoteText');
  if (quoteEl) {
    const randomIdx = Math.floor(Math.random() * FINANCIAL_QUOTES.length);
    quoteEl.textContent = FINANCIAL_QUOTES[randomIdx];
  }
}

/**
 * Display Supabase Setup Notice Banner if running in demo mode
 */
function setupConfigBanner() {
  const banner = document.getElementById('configAlertBanner');
  if (!banner) return;

  if (!isSupabaseConfigured()) {
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }
}

/**
 * Populate Category Dropdowns dynamically based on transaction type (income / expense)
 */
function populateCategorySelect(selectId, type) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = '<option value="" disabled selected>Select Category</option>';

  Object.entries(CATEGORY_MAP).forEach(([name, meta]) => {
    if (meta.type === type) {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    }
  });
}

/**
 * Navigation & Tab Switching
 */
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item[data-tab]');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = item.getAttribute('data-tab');
      if (tab === 'add-money') {
        openAddMoneyModal();
        return;
      }
      switchTab(tab);

      // Close mobile drawer if open
      closeMobileDrawer();
    });
  });

  // Topbar quick "Add Money" button
  const topbarAddBtn = document.getElementById('btnQuickAddMoney');
  if (topbarAddBtn) {
    topbarAddBtn.addEventListener('click', () => {
      openAddMoneyModal();
    });
  }

  // Sidebar Logout
  const logoutBtn = document.getElementById('btnSidebarLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      handleLogout();
    });
  }
}

function switchTab(tabName) {
  activeTab = tabName;

  // Update Sidebar active state
  document.querySelectorAll('.nav-item').forEach(el => {
    if (el.getAttribute('data-tab') === tabName) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  // Update Tab Views
  document.querySelectorAll('.tab-view').forEach(view => {
    if (view.id === `tab-${tabName}`) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });

  // Update Page Title
  const titleEl = document.getElementById('pageTitleText');
  const subEl = document.getElementById('pageSubtitleText');

  const titles = {
    overview: { title: 'Dashboard Overview', sub: 'Monitor your net balance, recent flows and instant actions' },
    analytics: { title: 'Financial Analytics', sub: 'Deep dive into your monthly spending, categories, and trends' },
    advisor: { title: 'AI Financial Advisor', sub: 'Smart budget diagnostics, 50/30/20 audit and wealth recommendations' },
    transactions: { title: 'Transaction History', sub: 'Search, filter, view and manage all your historical records' }
  };

  if (titles[tabName]) {
    if (titleEl) titleEl.textContent = titles[tabName].title;
    if (subEl) subEl.textContent = titles[tabName].sub;
  }

  // Trigger Analytics chart resize on view
  if (tabName === 'analytics') {
    updateAnalyticsViews(userTransactions);
  }
}

/**
 * Mobile Drawer Controls
 */
function setupMobileDrawer() {
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const closeBtn = document.getElementById('sidebarCloseBtn');
  const sidebar = document.getElementById('appSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');

  if (toggleBtn && sidebar && backdrop) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.add('show');
      backdrop.classList.add('active');
    });
  }

  if (closeBtn && sidebar && backdrop) {
    closeBtn.addEventListener('click', closeMobileDrawer);
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeMobileDrawer);
  }
}

function closeMobileDrawer() {
  const sidebar = document.getElementById('appSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sidebar) sidebar.classList.remove('show');
  if (backdrop) backdrop.classList.remove('active');
}

/**
 * Refresh All Data and Recalculate Dashboard
 */
async function refreshDashboardData() {
  try {
    const txns = await loadTransactions(currentUser.id);
    
    // 1. Calculate & Render Summary Cards
    const totals = calculateFinancialTotals(txns);
    updateSummaryCards(totals);

    // 2. Render Overview Recent Transactions (latest 5)
    renderTransactionRows(txns, 'recentTransactionsBody', true);

    // 3. Render Full Transactions Tab
    applyTransactionFilters();

    // 4. Update Analytics
    updateAnalyticsViews(txns);

    // 5. Update AI Advisor
    updateAdvisorViews(txns);

  } catch (error) {
    console.error('Error refreshing dashboard data:', error);
    showToast('Failed to load transaction data', 'error');
  }
}

/**
 * Update the 5 Summary Cards
 */
function updateSummaryCards(totals) {
  const balEl = document.getElementById('summaryTotalBalance');
  const incEl = document.getElementById('summaryTotalIncome');
  const expEl = document.getElementById('summaryTotalExpense');
  const savEl = document.getElementById('summarySavingsRate');
  const cntEl = document.getElementById('summaryTotalCount');
  const balTrendEl = document.getElementById('balanceTrendBadge');

  if (balEl) balEl.textContent = formatCurrency(totals.balance);
  if (incEl) incEl.textContent = formatCurrency(totals.income);
  if (expEl) expEl.textContent = formatCurrency(totals.spending);
  if (savEl) savEl.textContent = `${totals.savingsRate}%`;
  if (cntEl) cntEl.textContent = totals.count;

  if (balTrendEl) {
    if (totals.balance >= 0) {
      balTrendEl.className = 'trend-pill trend-up';
      balTrendEl.innerHTML = '<i class="fa-solid fa-arrow-trend-up"></i> Positive';
    } else {
      balTrendEl.className = 'trend-pill trend-down';
      balTrendEl.innerHTML = '<i class="fa-solid fa-arrow-trend-down"></i> Deficit';
    }
  }
}

/**
 * Setup Quick Add Transaction Form
 */
function setupQuickForm() {
  const typeBtns = document.querySelectorAll('.type-toggle-btn[data-type]');
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-type');
      activeTxnType = type;

      typeBtns.forEach(b => {
        b.classList.remove('active-income', 'active-expense');
      });

      if (type === 'income') {
        btn.classList.add('active-income');
      } else {
        btn.classList.add('active-expense');
      }

      populateCategorySelect('txnCategory', type);
    });
  });

  // Set default date to today
  const dateInput = document.getElementById('txnDate');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  const form = document.getElementById('quickAddTxnForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const descInput = document.getElementById('txnDescription');
      const amtInput = document.getElementById('txnAmount');
      const catInput = document.getElementById('txnCategory');
      const dateInp = document.getElementById('txnDate');
      const submitBtn = document.getElementById('btnSubmitTxn');

      const description = descInput.value.trim();
      const amount = parseFloat(amtInput.value);
      const category = catInput.value;
      const date = dateInp.value;

      if (!description || isNaN(amount) || amount <= 0 || !category || !date) {
        showToast('Please fill all transaction fields properly', 'warning');
        return;
      }

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';
        }

        await createTransaction(currentUser.id, {
          description,
          amount,
          type: activeTxnType,
          category,
          date
        });

        // Reset form
        descInput.value = '';
        amtInput.value = '';
        catInput.selectedIndex = 0;
        dateInp.value = new Date().toISOString().split('T')[0];

        showToast('Transaction added successfully!', 'success');
        await refreshDashboardData();

      } catch (err) {
        console.error('Error adding transaction:', err);
        showToast(err.message || 'Error saving transaction', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Transaction';
        }
      }
    });
  }
}

/**
 * Setup Edit Transaction Modal Form
 */
function setupEditForm() {
  const form = document.getElementById('editTxnForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!editingTxnId) return;

      const desc = document.getElementById('editTxnDesc').value.trim();
      const amt = parseFloat(document.getElementById('editTxnAmount').value);
      const type = document.getElementById('editTxnType').value;
      const cat = document.getElementById('editTxnCategory').value;
      const date = document.getElementById('editTxnDate').value;
      const btn = document.getElementById('btnSaveEditTxn');

      if (!desc || isNaN(amt) || amt <= 0 || !cat || !date) {
        showToast('Please verify all fields', 'warning');
        return;
      }

      try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';

        await editTransaction(currentUser.id, editingTxnId, {
          description: desc,
          amount: amt,
          type,
          category: cat,
          date
        });

        closeModal('editTxnModal');
        showToast('Transaction updated successfully', 'success');
        await refreshDashboardData();
      } catch (err) {
        showToast(err.message || 'Failed to update transaction', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = 'Save Changes';
      }
    });
  }

  // Edit Type Change Handler
  const editTypeSelect = document.getElementById('editTxnType');
  if (editTypeSelect) {
    editTypeSelect.addEventListener('change', () => {
      populateCategorySelect('editTxnCategory', editTypeSelect.value);
    });
  }
}

/**
 * Open Edit Modal with Pre-populated data
 */
window.openEditModal = function(id) {
  const txn = userTransactions.find(t => t.id === id);
  if (!txn) return;

  editingTxnId = id;
  document.getElementById('editTxnDesc').value = txn.description;
  document.getElementById('editTxnAmount').value = txn.amount;
  document.getElementById('editTxnType').value = txn.type;
  
  populateCategorySelect('editTxnCategory', txn.type);
  document.getElementById('editTxnCategory').value = txn.category;
  document.getElementById('editTxnDate').value = txn.date;

  openModal('editTxnModal');
};

/**
 * Open Delete Modal
 */
window.openDeleteModal = function(id) {
  deletingTxnId = id;
  openModal('deleteTxnModal');
};

/**
 * Confirm Delete Transaction
 */
window.confirmDeleteTxn = async function() {
  if (!deletingTxnId) return;
  const btn = document.getElementById('btnConfirmDelete');
  try {
    if (btn) btn.disabled = true;
    await removeTransaction(currentUser.id, deletingTxnId);
    closeModal('deleteTxnModal');
    showToast('Transaction deleted', 'success');
    await refreshDashboardData();
  } catch (err) {
    showToast(err.message || 'Failed to delete transaction', 'error');
  } finally {
    if (btn) btn.disabled = false;
    deletingTxnId = null;
  }
};

/**
 * Open Quick Add Money Modal
 */
function openAddMoneyModal() {
  // Set type to income
  const quickIncomeBtn = document.querySelector('.type-toggle-btn[data-type="income"]');
  if (quickIncomeBtn) quickIncomeBtn.click();
  
  // Switch to overview or focus quick form
  switchTab('overview');
  const descInput = document.getElementById('txnDescription');
  if (descInput) {
    descInput.focus();
    descInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/**
 * Setup Transaction Filtering & Search
 */
function setupSearchAndFilters() {
  const searchInput = document.getElementById('txnSearchInput');
  const typeFilter = document.getElementById('txnTypeFilter');
  const catFilter = document.getElementById('txnCategoryFilter');
  const sortFilter = document.getElementById('txnSortFilter');

  // Populate Filter category dropdown
  if (catFilter) {
    catFilter.innerHTML = '<option value="all">All Categories</option>';
    Object.keys(CATEGORY_MAP).forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      catFilter.appendChild(opt);
    });
  }

  if (searchInput) searchInput.addEventListener('input', applyTransactionFilters);
  if (typeFilter) typeFilter.addEventListener('change', applyTransactionFilters);
  if (catFilter) catFilter.addEventListener('change', applyTransactionFilters);
  if (sortFilter) sortFilter.addEventListener('change', applyTransactionFilters);
}

function applyTransactionFilters() {
  const search = document.getElementById('txnSearchInput')?.value || '';
  const type = document.getElementById('txnTypeFilter')?.value || 'all';
  const category = document.getElementById('txnCategoryFilter')?.value || 'all';
  const sort = document.getElementById('txnSortFilter')?.value || 'newest';

  const filtered = filterTransactions(userTransactions, { search, type, category, sort });
  renderTransactionRows(filtered, 'allTransactionsBody', false);
}

/**
 * Generic Modal Helpers
 */
window.openModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
};

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
};

/**
 * Save Supabase config from runtime modal
 */
window.submitSupabaseConfig = function() {
  const url = document.getElementById('setupSupabaseUrl')?.value;
  const key = document.getElementById('setupSupabaseKey')?.value;

  if (!url || !key) {
    showToast('Please enter both Supabase URL and Anon Key', 'warning');
    return;
  }

  saveSupabaseConfig(url, key);
};
