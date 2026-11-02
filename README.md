# FINORA – Personal Finance & Expense Tracker

FINORA is an elegant, full-featured personal finance and expense tracking web application. It combines modern fintech design aesthetics with powerful financial analytics, algorithmic AI budgeting diagnostics, and bank-grade multi-user data isolation powered by **Supabase PostgreSQL & Auth**.

Inspired by the original FINORA design, this implementation adds a complete **Authentication & Multi-User Registration System**, strict **Row Level Security (RLS)**, real-time **Chart.js analytics**, and a **Rule-Based AI Financial Advisor**.

---

## 🌟 Key Features

### 1. 🔐 Secure Authentication & User Registration
- **Registration**: Full name, email, password strength meter, password confirmation matching, and automated user profile creation.
- **Login**: Email and password authentication with "Remember Me" and password visibility toggle.
- **Forgot Password**: One-click password reset email delivery via Supabase Auth.
- **Session Management**: Persistent authenticated sessions with automatic route guards (`dashboard.html` requires auth; `login.html` and `register.html` redirect active sessions).
- **Logout**: Seamless token invalidation and redirection to sign-in.

### 2. 👥 Multi-User Data Isolation
- Backed by **Supabase PostgreSQL** with **Row Level Security (RLS)** enabled on all tables.
- **User A** and **User B** can use the application concurrently with 100% independent ledgers. Neither user can query, insert, modify, or delete the other's records.

### 3. 📊 Dashboard & Financial Summary
- **Personalized Welcome Banner**: Greets the logged-in user by name, shows the current date, and rotates inspirational financial quotes.
- **5 Live Metric Cards**:
  1. **Total Balance** (Net cash flow with positive/deficit trend indicator)
  2. **Total Income** (Sum of earnings)
  3. **Total Spending** (Sum of expenses)
  4. **Savings Rate** (Savings as a percentage of income vs. 20% benchmark)
  5. **Total Transactions** (Total logged activities)
- **Quick Add Transaction**: Instant income/expense logging with categorized dropdowns, custom amounts, and dates.
- **Spending Overview**: Real-time category percentage progress bars and embedded Doughnut chart.

### 4. 🤖 AI Financial Advisor (Rule-Based Intelligence)
- **Financial Health Score (0 - 100)**: Evaluates savings rate, net cash positivity, expense diversification, and safety buffers.
- **50 / 30 / 20 Budget Rule Audit**: Classifies expenses into **Needs** (50%), **Wants** (30%), and **Savings** (20%) with visual comparison bars.
- **Smart Dynamic Insights**: Contextual alerts tailored to real spending patterns (e.g., category outlier warnings, savings momentum milestones, emergency fund targets).

### 5. 📈 Deep Financial Analytics (Chart.js)
- **Income vs. Expenses**: Monthly comparative column/bar chart.
- **Category Breakdown**: Interactive multi-colored doughnut chart with percentage tooltips.
- **Cash Flow Trajectory**: Smooth gradient area chart showing cumulative account balance over time.
- **Key Financial Ratios**: Average transaction size, monthly burn rate, daily average spending, and peak single expense.

### 6. 📝 Complete Transaction Management
- Search records in real-time by description or category.
- Filter by transaction type (Income / Expense) or specific categories.
- Sort by Newest, Oldest, Highest Amount, or Lowest Amount.
- **Edit Modal**: Update any existing record with live recalculation.
- **Delete Modal**: Secure permanent deletion with confirmation dialog.
- Responsive table with friendly empty states.

---

## 📁 Project Directory Structure

```text
FINORA/
├── index.html              # Landing page introducing FINORA features
├── login.html              # User login page with Supabase Auth
├── register.html           # User registration page with strength meter
├── dashboard.html          # Main financial dashboard & tab views
├── css/
│   ├── style.css           # Core dashboard styling, cards, tables, modals
│   ├── auth.css            # Authentication views styling & split layout
│   └── responsive.css      # Tablet and mobile responsive rules & drawer
├── js/
│   ├── supabase-config.js  # Supabase client setup & shared helper utilities
│   ├── auth.js             # Authentication controllers, route guards & session
│   ├── dashboard.js        # Dashboard state, metrics calculation & event handling
│   ├── transactions.js     # Transaction CRUD operations & filtering
│   ├── analytics.js        # Chart.js visualization generation
│   └── advisor.js          # AI rule-based diagnostic engine & health score
├── database/
│   ├── schema.sql          # PostgreSQL tables (profiles, transactions) & triggers
│   └── policies.sql        # Row Level Security (RLS) policies for multi-user safety
├── assets/
│   ├── images/             # FINORA SVG brand logos, favicons, avatars
│   └── icons/              # Supplementary icon assets
└── README.md               # Documentation & setup guide
```

---

## 🛠️ Step-by-Step Supabase Setup Guide

FINORA is built to connect seamlessly to your Supabase project in under 3 minutes.

### Step 1: Create a Supabase Project
1. Go to [https://supabase.com/](https://supabase.com/) and create a free account.
2. Click **New Project**, choose an organization, give your project a name (e.g., `finora-finance`), set a database password, and choose your preferred region.

### Step 2: Run the Database Schema
1. In your Supabase dashboard, click **SQL Editor** from the left navigation menu.
2. Click **New query**.
3. Open `database/schema.sql` from this repository, copy its entire contents, paste them into the SQL editor, and click **Run**.
   - This creates the `profiles` and `transactions` tables, performance indexes, and the automated trigger for new users.

### Step 3: Apply Row Level Security (RLS) Policies
1. In the **SQL Editor**, open another **New query**.
2. Open `database/policies.sql` from this repository, copy its entire contents, paste them into the SQL editor, and click **Run**.
   - This activates RLS and sets policies ensuring users can only read, write, edit, and delete their own records.

### Step 4: Configure Supabase Credentials in the App
1. In your Supabase dashboard, navigate to **Project Settings** (gear icon) &rarr; **API**.
2. Copy your **Project URL** and your **Project API Key** (`anon` public key).
3. Open `js/supabase-config.js` and replace the placeholder constants:
   ```javascript
   const DEFAULT_SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
   const DEFAULT_SUPABASE_ANON_KEY = 'YOUR_ACTUAL_ANON_PUBLIC_KEY';
   ```
4. *Alternative*: You can also open the web application in your browser and click the **Connect Supabase** banner at the top of the dashboard to enter your credentials directly into the UI!

### Step 5: (Optional) Email Confirmation Setting
- By default, Supabase sends a verification email upon registration.
- If you prefer immediate sign-in during development without checking an inbox:
  1. In Supabase, go to **Authentication** &rarr; **Providers** &rarr; **Email**.
  2. Toggle off **Confirm email**.
  3. Click **Save**.

---

## 💻 Running the Project Locally

You have two convenient ways to run FINORA locally:

### Option A: Using `npm run dev` (Vite)
If you have **Node.js** installed on your system:

1. Open a terminal in the project directory:
   ```bash
   cd C:\Users\pranj\.gemini\antigravity\scratch\FINORA
   ```
2. Install the lightweight development dependency:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Vite will automatically launch `http://localhost:5173/` in your default browser with instant hot reloading!

---

### Option B: Using VS Code Live Server (Zero-Install / No Node.js Required)
If you prefer not to use Node.js:

1. Open **Visual Studio Code**.
2. Go to **File** &rarr; **Open Folder...** and select `C:\Users\pranj\.gemini\antigravity\scratch\FINORA`.
3. Install the **Live Server** extension (by *Ritwick Dey*) from the VS Code Extensions Marketplace (`Ctrl+Shift+X` &rarr; search "Live Server").
4. Right-click on [`index.html`](file:///C:/Users/pranj/.gemini/antigravity/scratch/FINORA/index.html) or [`login.html`](file:///C:/Users/pranj/.gemini/antigravity/scratch/FINORA/login.html) and select **Open with Live Server**.
5. Your browser will launch at `http://127.0.0.1:5500/index.html`.

---

## 🧪 Testing Multi-User Data Isolation

To verify that multiple accounts operate independently without data leaks:

1. Open `http://127.0.0.1:5500/register.html`.
2. Register **User A** (e.g. `alice@example.com` / `Password123!`).
3. Add transactions for User A:
   - Income: `$5,000` (Salary)
   - Expense: `$1,200` (Rent)
   - Expense: `$300` (Groceries)
4. Verify that Total Balance shows `$3,500.00` and all charts render accurately.
5. Click the **Logout** button in the sidebar.
6. Register **User B** (e.g. `bob@example.com` / `Password123!`).
7. Observe User B's dashboard:
   - Total Balance starts fresh at `$0.00`.
   - Transactions list is completely empty.
   - User B cannot see any of Alice's records.
8. Add a transaction for Bob (e.g., Income: `$2,500`).
9. Log back in as Alice: Alice's original `$3,500.00` balance and transactions remain completely intact!

---

## 🚀 GitHub Pages Deployment Guide

1. Create a new repository on GitHub (e.g., `finora-personal-finance`).
2. Push your files to the `main` branch.
3. In your GitHub repository, navigate to **Settings** &rarr; **Pages**.
4. Under **Branch**, select `main` and root `/`, then click **Save**.
5. Under **Authentication Redirects** in your Supabase dashboard:
   - Go to **Authentication** &rarr; **URL Configuration**.
   - Add your GitHub Pages URL (e.g. `https://yourusername.github.io/finora-personal-finance/`) to the **Redirect URLs** list.
6. Your live FINORA website is now deployed worldwide!

---

## 🔒 Security Best Practices Implemented

- **No Service Role Keys Exposed**: The frontend uses only the public `anon` key.
- **Row Level Security (RLS)**: Enforced directly at the PostgreSQL kernel level.
- **Password Masking**: Client-side toggles with standard password sanitization.
- **Client Route Protection**: Unauthenticated requests to `dashboard.html` automatically redirect to `login.html`.

---

## 📜 License

Created for **FINORA – Personal Finance**. All rights reserved.
