/**
 * ========================================================
 * FINORA – Authentication System (Supabase Auth)
 * ========================================================
 */

// Local Demo User Storage Key (fallback only when Supabase isn't configured)
const DEMO_USER_KEY = 'finora_demo_user';
const DEMO_USERS_LIST = 'finora_registered_demo_users';

/**
 * Get the currently logged-in user (from Supabase session or local demo session)
 */
async function getCurrentUser() {
  const client = getSupabaseClient();
  
  if (client) {
    try {
      const { data: { session }, error } = await client.auth.getSession();
      if (error || !session || !session.user) {
        return null;
      }
      
      const user = session.user;
      
      // 1. Get full name from user_metadata (stored during signup)
      let fullName = user.user_metadata?.full_name || '';

      // 2. Fetch or update public profiles table
      try {
        const { data: profile } = await client
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .maybeSingle();

        if (profile && profile.full_name) {
          fullName = profile.full_name;
        } else if (fullName) {
          // Self-heal: Ensure record exists in profiles table
          try {
            await client.from('profiles').upsert({
              id: user.id,
              full_name: fullName,
              email: user.email,
              updated_at: new Date().toISOString()
            });
          } catch (healErr) {
            console.warn('Profile self-heal notice:', healErr);
          }
        }
      } catch (profileErr) {
        console.warn('Profile query notice (non-fatal):', profileErr);
      }

      // Fallback name if neither metadata nor profile has it
      if (!fullName) {
        fullName = user.email ? user.email.split('@')[0] : 'Finora User';
      }
        
      return {
        id: user.id,
        email: user.email,
        fullName: fullName,
        createdAt: user.created_at,
        isDemo: false
      };
    } catch (e) {
      console.error('Error fetching Supabase session:', e);
      return null;
    }
  }

  // Fallback to Demo session if Supabase is unconfigured
  const demoUser = localStorage.getItem(DEMO_USER_KEY);
  if (demoUser) {
    try {
      return JSON.parse(demoUser);
    } catch (e) {
      return null;
    }
  }

  return null;
}

/**
 * Auth Guard for Dashboard: redirects to login if unauthenticated
 */
async function protectDashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.replace('login.html?redirect=unauthorized');
    return null;
  }
  return user;
}

/**
 * Auth Guard for Login / Register pages: redirects to dashboard if already logged in
 */
async function redirectIfLoggedIn() {
  const user = await getCurrentUser();
  if (user) {
    window.location.replace('dashboard.html');
  }
}

/**
 * Handle User Login
 */
async function handleLogin(email, password, rememberMe = false) {
  const client = getSupabaseClient();

  if (client) {
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        throw new Error('Please confirm your email address before logging in, or check your spam folder.');
      } else if (error.message.toLowerCase().includes('invalid login credentials')) {
        throw new Error('Invalid email or password. Please verify your credentials.');
      }
      throw new Error(error.message || 'Login failed. Please check your credentials.');
    }

    if (rememberMe) {
      localStorage.setItem('finora_remembered_email', email.trim());
    } else {
      localStorage.removeItem('finora_remembered_email');
    }

    // Sync profile in background
    if (data.user) {
      const name = data.user.user_metadata?.full_name;
      if (name) {
        try {
          await client.from('profiles').upsert({
            id: data.user.id,
            full_name: name,
            email: data.user.email,
            updated_at: new Date().toISOString()
          });
        } catch (syncErr) {
          console.warn('Profile sync notice:', syncErr);
        }
      }
    }

    return data.user;
  }

  // --- DEMO MODE FALLBACK ---
  console.warn('Handling login in Local Demo Mode');
  let registered = [];
  try {
    registered = JSON.parse(localStorage.getItem(DEMO_USERS_LIST) || '[]');
  } catch (e) {
    registered = [];
  }

  const found = registered.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  
  if (found) {
    if (found.password !== password) {
      throw new Error('Incorrect password for this demo account.');
    }
  }

  const demoUserObj = {
    id: found ? found.id : 'demo-user-' + Math.random().toString(36).substring(2, 9),
    email: email.trim(),
    fullName: found ? found.fullName : email.split('@')[0],
    isDemo: true
  };

  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUserObj));

  if (rememberMe) {
    localStorage.setItem('finora_remembered_email', email.trim());
  } else {
    localStorage.removeItem('finora_remembered_email');
  }

  return demoUserObj;
}

/**
 * Handle User Registration
 */
async function handleRegister(fullName, email, password) {
  const client = getSupabaseClient();

  if (client) {
    // 1. Sign up with Supabase Auth
    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          full_name: fullName.trim()
        }
      }
    });

    if (error) {
      throw new Error(error.message || 'Registration failed.');
    }

    // Supabase security: if identities array is empty, user already exists
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error('An account with this email already exists. Please log in instead.');
    }

    let session = data.session;

    // 2. If session wasn't returned in signUp (e.g. autoconfirm), attempt direct sign-in
    if (!session && data.user) {
      try {
        const loginRes = await client.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });
        if (loginRes.data && loginRes.data.session) {
          session = loginRes.data.session;
        }
      } catch (signInErr) {
        console.log('Direct sign in check notice:', signInErr.message);
      }
    }

    // 3. Ensure profiles table row is saved
    if (data.user) {
      try {
        await client.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName.trim(),
          email: email.trim(),
          updated_at: new Date().toISOString()
        });
      } catch (profileErr) {
        console.warn('Profile table upsert info:', profileErr);
      }
    }

    return {
      user: data.user,
      session: session,
      requiresEmailVerification: !session
    };
  }

  // --- DEMO MODE FALLBACK ---
  console.warn('Handling registration in Local Demo Mode');
  let registered = [];
  try {
    registered = JSON.parse(localStorage.getItem(DEMO_USERS_LIST) || '[]');
  } catch (e) {
    registered = [];
  }

  const exists = registered.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (exists) {
    throw new Error('An account with this email already exists in local demo storage.');
  }

  const newDemoUser = {
    id: 'demo-user-' + Date.now(),
    fullName: fullName.trim(),
    email: email.trim(),
    password: password,
    isDemo: true
  };

  registered.push(newDemoUser);
  localStorage.setItem(DEMO_USERS_LIST, JSON.stringify(registered));
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(newDemoUser));

  return {
    user: newDemoUser,
    session: true,
    requiresEmailVerification: false
  };
}

/**
 * Handle User Logout
 */
async function handleLogout() {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
  }

  localStorage.removeItem(DEMO_USER_KEY);
  window.location.replace('login.html?logout=success');
}

/**
 * Request Password Reset Email
 */
async function handleForgotPassword(email) {
  const client = getSupabaseClient();
  if (client) {
    const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + window.location.pathname
    });
    if (error) {
      throw new Error(error.message);
    }
    return true;
  }
  return true;
}

/**
 * Helper: Toggle Password Visibility
 */
function initPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.password-toggle-btn');
  toggleButtons.forEach(btn => {
    btn.onclick = function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      const icon = this.querySelector('i');
      if (icon) {
        if (isPassword) {
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        } else {
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
      }
    };
  });
}

/**
 * Helper: Password Strength Evaluation
 */
function calculatePasswordStrength(password) {
  let score = 0;
  if (!password) return { score: 0, label: 'None', color: '#E2E8F0', width: '0%' };

  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) {
    return { score, label: 'Weak', color: '#EF4444', width: '30%' };
  } else if (score <= 4) {
    return { score, label: 'Medium', color: '#F59E0B', width: '65%' };
  } else {
    return { score, label: 'Strong', color: '#10B981', width: '100%' };
  }
}
