-- ========================================================
-- FINORA – Personal Finance & Expense Tracker
-- Supabase PostgreSQL Database Schema
-- ========================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------
-- 1. PROFILES TABLE
-- Stores public profile data linked to auth.users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comments for profiles table
COMMENT ON TABLE public.profiles IS 'Stores user personal profile details linked to auth.users';
COMMENT ON COLUMN public.profiles.id IS 'References the Supabase auth.users UUID';
COMMENT ON COLUMN public.profiles.full_name IS 'Full name provided during registration';
COMMENT ON COLUMN public.profiles.email IS 'User primary email address';

-- --------------------------------------------------------
-- 2. TRANSACTIONS TABLE
-- Stores personal income and expense records
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comments for transactions table
COMMENT ON TABLE public.transactions IS 'Stores financial transactions (income & expense)';
COMMENT ON COLUMN public.transactions.user_id IS 'Owner user ID linked to auth.users';
COMMENT ON COLUMN public.transactions.amount IS 'Monetary amount (strictly positive)';
COMMENT ON COLUMN public.transactions.type IS 'Transaction classification: income or expense';
COMMENT ON COLUMN public.transactions.category IS 'Category tag (e.g., Food, Salary, Housing)';
COMMENT ON COLUMN public.transactions.date IS 'Date of financial event';

-- --------------------------------------------------------
-- 3. PERFORMANCE INDEXES
-- Optimizes query speeds for dashboard lookups
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(user_id, category);

-- --------------------------------------------------------
-- 4. AUTOMATIC PROFILE CREATION TRIGGER
-- Whenever a user signs up via Supabase Auth,
-- insert a matching row into public.profiles
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if re-running
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Bind trigger to auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
