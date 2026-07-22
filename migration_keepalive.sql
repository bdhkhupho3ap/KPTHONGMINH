-- SQL Schema for Supabase KeepAlive & Health Monitor Engine

-- 1. Create system health logs table
CREATE TABLE IF NOT EXISTS public.system_health_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    latency_ms INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'online', 'warning', 'critical', 'offline'
    services JSONB NOT NULL,     -- status details for database, API, Auth, Storage, Realtime, RPC
    error_message TEXT
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.system_health_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow only authenticated managers or admin roles, or anonymous select/insert depending on client architecture)
-- Since we read it from Admin Dashboard and write from background service:
CREATE POLICY "Allow authenticated managers to view system health logs"
ON public.system_health_logs
FOR SELECT
TO authenticated
USING (true); -- Full select permission for connected app clients

CREATE POLICY "Allow authenticated manager or public service insert system health logs"
ON public.system_health_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (true); -- Allow service endpoints to log health status

-- 2. Create ping_db RPC function
CREATE OR REPLACE FUNCTION public.ping_db()
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    RETURN now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create log cleanup function
CREATE OR REPLACE FUNCTION public.clean_old_health_logs(retention_days INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
    deleted_rows INTEGER;
BEGIN
    DELETE FROM public.system_health_logs
    WHERE timestamp < (now() - (retention_days || ' days')::INTERVAL);
    GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    RETURN deleted_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
