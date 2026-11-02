-- ========================================================
-- FINORA – Row Level Security (RLS) & Access Policies
-- Ensures complete multi-user isolation:
-- Each authenticated user can ONLY access and modify their own records.
-- ========================================================

-- --------------------------------------------------------
-- 1. ENABLE ROW LEVEL SECURITY
-- --------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- 2. POLICIES FOR 'profiles' TABLE
-- --------------------------------------------------------

-- Drop any previous versions of policies to ensure clean state
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- Allow users to read only their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Allow users to insert their own profile (useful if client fallback triggers)
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Allow users to update only their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- --------------------------------------------------------
-- 3. POLICIES FOR 'transactions' TABLE
-- --------------------------------------------------------

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;

-- 1. SELECT: Users can only query transactions where user_id matches their authenticated UID
CREATE POLICY "Users can view own transactions"
    ON public.transactions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 2. INSERT: Users can only insert records where user_id matches their authenticated UID
CREATE POLICY "Users can insert own transactions"
    ON public.transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE: Users can only edit transactions that belong to them
CREATE POLICY "Users can update own transactions"
    ON public.transactions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. DELETE: Users can only delete their own transactions
CREATE POLICY "Users can delete own transactions"
    ON public.transactions
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
