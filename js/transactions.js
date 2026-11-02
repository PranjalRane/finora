/**
 * ========================================================
 * FINORA – Transactions Data Management (CRUD & State)
 * ========================================================
 */

// Category Definitions with Icons and Color Accents
const CATEGORY_MAP = {
  // Income Categories
  'Salary': { icon: 'fa-briefcase', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', type: 'income' },
  'Freelance': { icon: 'fa-laptop-code', color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.12)', type: 'income' },
  'Investments': { icon: 'fa-arrow-trend-up', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)', type: 'income' },
  'Business': { icon: 'fa-building', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.12)', type: 'income' },
  'Gift': { icon: 'fa-gift', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)', type: 'income' },
  'Other Income': { icon: 'fa-coins', color: '#14B8A6', bg: 'rgba(20, 184, 166, 0.12)', type: 'income' },

  // Expense Categories
  'Food & Dining': { icon: 'fa-utensils', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', type: 'expense' },
  'Shopping': { icon: 'fa-bag-shopping', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)', type: 'expense' },
  'Housing & Rent': { icon: 'fa-house', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', type: 'expense' },
  'Utilities': { icon: 'fa-bolt', color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)', type: 'expense' },
  'Transportation': { icon: 'fa-car', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.12)', type: 'expense' },
  'Entertainment': { icon: 'fa-gamepad', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)', type: 'expense' },
  'Healthcare': { icon: 'fa-heart-pulse', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', type: 'expense' },
  'Education': { icon: 'fa-graduation-cap', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)', type: 'expense' },
  'Travel': { icon: 'fa-plane', color: '#14B8A6', bg: 'rgba(20, 184, 166, 0.12)', type: 'expense' },
  'Personal Care': { icon: 'fa-spa', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)', type: 'expense' },
  'Other Expense': { icon: 'fa-receipt', color: '#64748B', bg: 'rgba(100, 116, 139, 0.12)', type: 'expense' }
};

// Global in-memory cache of transactions for active user
let userTransactions = [];

/**
 * Fetch all transactions for a specific user from Supabase or Local Demo Storage
 */
async function loadTransactions(userId) {
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching transactions from Supabase:', error);
        throw error;
      }

      userTransactions = data || [];
      return userTransactions;
    } catch (e) {
      console.warn('Fallback: reading transactions from local cache.');
    }
  }

  // --- LOCAL DEMO STORAGE (Multi-user isolated by userId) ---
  const storageKey = `finora_txns_${userId}`;
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      userTransactions = JSON.parse(saved);
    } catch (e) {
      userTransactions = [];
    }
  } else {
    // Initial sample transactions for a new demo user so they can explore the UI immediately
    userTransactions = [
      {
        id: 'sample-1',
        user_id: userId,
        description: 'Monthly Salary Deposit',
        amount: 4500.00,
        type: 'income',
        category: 'Salary',
        date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
        created_at: new Date(Date.now() - 3 * 86400000).toISOString()
      },
      {
        id: 'sample-2',
        user_id: userId,
        description: 'Apartment Rent',
        amount: 1400.00,
        type: 'expense',
        category: 'Housing & Rent',
        date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
        created_at: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        id: 'sample-3',
        user_id: userId,
        description: 'Supermarket Groceries',
        amount: 165.40,
        type: 'expense',
        category: 'Food & Dining',
        date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
        created_at: new Date(Date.now() - 1 * 86400000).toISOString()
      },
      {
        id: 'sample-4',
        user_id: userId,
        description: 'Freelance Web Design Project',
        amount: 850.00,
        type: 'income',
        category: 'Freelance',
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      },
      {
        id: 'sample-5',
        user_id: userId,
        description: 'Electricity & High-Speed Internet',
        amount: 120.00,
        type: 'expense',
        category: 'Utilities',
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(storageKey, JSON.stringify(userTransactions));
  }

  return userTransactions;
}

/**
 * Add a new transaction
 */
async function createTransaction(userId, txn) {
  const client = getSupabaseClient();
  const newTxn = {
    user_id: userId,
    description: txn.description.trim(),
    amount: parseFloat(txn.amount),
    type: txn.type,
    category: txn.category,
    date: txn.date || new Date().toISOString().split('T')[0]
  };

  if (client) {
    const { data, error } = await client
      .from('transactions')
      .insert([newTxn])
      .select();

    if (error) {
      throw new Error(error.message || 'Failed to save transaction to database.');
    }

    if (data && data.length > 0) {
      userTransactions.unshift(data[0]);
      return data[0];
    }
  }

  // Demo fallback
  newTxn.id = 'txn-' + Date.now();
  newTxn.created_at = new Date().toISOString();
  userTransactions.unshift(newTxn);

  const storageKey = `finora_txns_${userId}`;
  localStorage.setItem(storageKey, JSON.stringify(userTransactions));
  return newTxn;
}

/**
 * Update an existing transaction
 */
async function editTransaction(userId, id, updatedFields) {
  const client = getSupabaseClient();
  const patch = {
    description: updatedFields.description.trim(),
    amount: parseFloat(updatedFields.amount),
    type: updatedFields.type,
    category: updatedFields.category,
    date: updatedFields.date
  };

  if (client) {
    const { data, error } = await client
      .from('transactions')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) {
      throw new Error(error.message || 'Failed to update transaction.');
    }

    const idx = userTransactions.findIndex(t => t.id === id);
    if (idx !== -1 && data && data.length > 0) {
      userTransactions[idx] = data[0];
    }
    return data ? data[0] : patch;
  }

  // Demo fallback
  const idx = userTransactions.findIndex(t => t.id === id);
  if (idx !== -1) {
    userTransactions[idx] = { ...userTransactions[idx], ...patch };
    const storageKey = `finora_txns_${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(userTransactions));
    return userTransactions[idx];
  }
  return null;
}

/**
 * Delete a transaction
 */
async function removeTransaction(userId, id) {
  const client = getSupabaseClient();

  if (client) {
    const { error } = await client
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message || 'Failed to delete transaction.');
    }
  }

  userTransactions = userTransactions.filter(t => t.id !== id);

  // Demo fallback storage update
  const storageKey = `finora_txns_${userId}`;
  localStorage.setItem(storageKey, JSON.stringify(userTransactions));
  return true;
}

/**
 * Filter and sort transactions in memory
 */
function filterTransactions(list, { search = '', type = 'all', category = 'all', sort = 'newest' }) {
  let result = [...list];

  // Search filter (description or category)
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(t => 
      t.description.toLowerCase().includes(q) || 
      t.category.toLowerCase().includes(q)
    );
  }

  // Type filter
  if (type !== 'all') {
    result = result.filter(t => t.type === type);
  }

  // Category filter
  if (category !== 'all') {
    result = result.filter(t => t.category === category);
  }

  // Sorting
  result.sort((a, b) => {
    if (sort === 'newest') {
      return new Date(b.date) - new Date(a.date) || new Date(b.created_at || 0) - new Date(a.created_at || 0);
    } else if (sort === 'oldest') {
      return new Date(a.date) - new Date(b.date) || new Date(a.created_at || 0) - new Date(b.created_at || 0);
    } else if (sort === 'highest') {
      return parseFloat(b.amount) - parseFloat(a.amount);
    } else if (sort === 'lowest') {
      return parseFloat(a.amount) - parseFloat(b.amount);
    }
    return 0;
  });

  return result;
}

/**
 * Render transaction table rows
 */
function renderTransactionRows(txns, containerId, isOverviewPreview = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const displayList = isOverviewPreview ? txns.slice(0, 5) : txns;

  if (displayList.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-icon"><i class="fa-solid fa-receipt"></i></div>
            <div class="empty-title">No transactions found</div>
            <div class="empty-subtitle">Record your first income or expense using the form above or the "Add Money" button!</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = displayList.map(t => {
    const catMeta = CATEGORY_MAP[t.category] || {
      icon: 'fa-circle-dollar-to-slot',
      color: '#6366F1',
      bg: 'rgba(99, 102, 241, 0.12)'
    };

    const isIncome = t.type === 'income';
    const amountSign = isIncome ? '+' : '-';
    const amountClass = isIncome ? 'amount-income' : 'amount-expense';
    const badgeTypeClass = isIncome ? 'badge-type-income' : 'badge-type-expense';

    return `
      <tr data-id="${t.id}">
        <td>
          <div class="txn-desc-cell">
            <div class="txn-cat-icon" style="background:${catMeta.bg}; color:${catMeta.color};">
              <i class="fa-solid ${catMeta.icon}"></i>
            </div>
            <div>
              <div class="txn-desc-text">${escapeHtml(t.description)}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="badge-category">
            <span class="cat-color-dot" style="background:${catMeta.color};"></span>
            ${escapeHtml(t.category)}
          </span>
        </td>
        <td>${formatDate(t.date)}</td>
        <td>
          <span class="badge-type ${badgeTypeClass}">
            <i class="fa-solid ${isIncome ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
            ${t.type}
          </span>
        </td>
        <td class="${amountClass}">
          ${amountSign}${formatCurrency(t.amount)}
        </td>
        <td>
          <div class="action-btn-group">
            <button class="btn-icon-action btn-edit" title="Edit Transaction" onclick="openEditModal('${t.id}')">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn-icon-action btn-delete" title="Delete Transaction" onclick="openDeleteModal('${t.id}')">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}
