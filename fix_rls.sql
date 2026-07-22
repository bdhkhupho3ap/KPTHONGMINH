-- ====================================================================
-- FIX: ROW-LEVEL SECURITY (RLS) & GRANTS FOR SMART WARD MANAGEMENT
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/olmexwouxzqtdkuuthzo/sql)
-- ====================================================================

-- 1. DISABLE RLS (RECOMMENDED FOR QUICK DEV & DEPLOYMENT SYNC)
-- This allows requests with the anon key to read/write data directly without security blocks.
ALTER TABLE public."Household" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Person" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."businesses" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."incidents" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."system_health_logs" DISABLE ROW LEVEL SECURITY;

-- 2. EXPLICITLY GRANT USAGE AND CRUD PERMISSIONS TO PUBLIC ROLES
-- In case postgres has revoked or not inherited table grants for anon key requests.
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Household" TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Person" TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."businesses" TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."incidents" TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."system_health_logs" TO anon, authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
