/**
 * ========================================================
 * FINORA – Supabase Client Configuration & Shared Helpers
 * ========================================================
 */

// User Supabase Project Credentials
const DEFAULT_SUPABASE_URL = 'https://rxxgelkxclsjavxvevvm.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_HSIPaKeMY3IguAyrYsSQHQ_GO9MuE9b';

// Check if credentials are stored in localStorage
let storedUrl = localStorage.getItem('finora_supabase_url');
let storedKey = localStorage.getItem('finora_supabase_key');

// Clean up if localStorage holds old placeholder text
if (storedUrl && (storedUrl.includes('YOUR_SUPABASE_PROJECT_ID') || storedUrl.includes('undefined'))) {
  localStorage.removeItem('finora_supabase_url');
  storedUrl = null;
}
if (storedKey && (storedKey.includes('YOUR_SUPABASE_ANON_KEY') || storedKey.includes('undefined'))) {
  localStorage.removeItem('finora_supabase_key');
  storedKey = null;
}

const SUPABASE_URL = storedUrl || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = storedKey || DEFAULT_SUPABASE_ANON_KEY;

// Check if credentials are valid
function isSupabaseConfigured() {
  return (
    typeof SUPABASE_URL === 'string' &&
    typeof SUPABASE_ANON_KEY === 'string' &&
    SUPABASE_URL.trim().length > 0 &&
    SUPABASE_ANON_KEY.trim().length > 0 &&
    !SUPABASE_URL.includes('YOUR_SUPABASE_PROJECT_ID') &&
    !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY') &&
    SUPABASE_URL.startsWith('http')
  );
}

// Global Supabase client instance
let supabaseClient = null;

function initSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  
  if (typeof window.supabase !== 'undefined' && isSupabaseConfigured()) {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage
        }
      });
      console.log('✅ FINORA: Connected to Supabase backend successfully.');
    } catch (error) {
      console.error('❌ FINORA: Error initializing Supabase client:', error);
    }
  } else {
    console.warn('⚠️ FINORA: Running in Local Demo Mode (Supabase client not loaded or not configured).');
  }
  return supabaseClient;
}

// Initialize immediately if library is loaded
if (typeof window !== 'undefined') {
  initSupabaseClient();
}

/**
 * Returns active Supabase client (initializes lazily if needed)
 */
function getSupabaseClient() {
  if (!supabaseClient) {
    initSupabaseClient();
  }
  return supabaseClient;
}

/**
 * Save user custom Supabase configuration at runtime
 */
function saveSupabaseConfig(url, key) {
  if (!url || !key) return false;
  localStorage.setItem('finora_supabase_url', url.trim());
  localStorage.setItem('finora_supabase_key', key.trim());
  window.location.reload();
  return true;
}

/**
 * Reset Supabase configuration
 */
function resetSupabaseConfig() {
  localStorage.removeItem('finora_supabase_url');
  localStorage.removeItem('finora_supabase_key');
  window.location.reload();
}

/**
 * Global UI Helper: Toast Notifications
 */
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: 'fa-circle-check',
    error: 'fa-circle-exclamation',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };

  const icon = iconMap[type] || 'fa-bell';
  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <div class="toast-message">${escapeHtml(message)}</div>
    <button style="background:none;border:none;color:#94a3b8;cursor:pointer;padding:2px 6px;" onclick="this.parentElement.remove()">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Global Formatters
 */
function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(num);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
