-- SQL Schema for Supabase KeepAlive Monitor Table

-- 1. Create system_health tracking table
CREATE TABLE IF NOT EXISTS public.system_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    last_ping TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status VARCHAR(50) DEFAULT 'online' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to system_health" ON public.system_health;
DROP POLICY IF EXISTS "Allow authenticated write access to system_health" ON public.system_health;

-- Create policies
CREATE POLICY "Allow public read access to system_health" 
ON public.system_health FOR SELECT USING (true);

CREATE POLICY "Allow authenticated write access to system_health" 
ON public.system_health FOR ALL USING (true) WITH CHECK (true);

-- Insert initial record (ID='00000000-0000-0000-0000-000000000001') if it doesn't already exist
INSERT INTO public.system_health (id, last_ping, status)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, now(), 'online')
ON CONFLICT (id) DO NOTHING;
