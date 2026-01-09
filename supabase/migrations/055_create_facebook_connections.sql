-- =====================================================
-- CREATE FACEBOOK CONNECTIONS TABLE
-- Allow users to connect their Facebook accounts
-- =====================================================

-- Create facebook_connections table
CREATE TABLE IF NOT EXISTS public.facebook_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  facebook_id text NOT NULL,
  facebook_name text NOT NULL,
  facebook_email text,
  facebook_avatar text,
  connected_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_facebook_connections_user_id ON public.facebook_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_connections_facebook_id ON public.facebook_connections(facebook_id);
CREATE INDEX IF NOT EXISTS idx_facebook_connections_is_active ON public.facebook_connections(is_active);

-- Create unique constraint to prevent duplicate active connections
CREATE UNIQUE INDEX IF NOT EXISTS idx_facebook_connections_unique_active 
ON public.facebook_connections(user_id, is_active) 
WHERE is_active = true;

-- Create unique constraint to prevent same Facebook account connecting to multiple users
CREATE UNIQUE INDEX IF NOT EXISTS idx_facebook_connections_unique_facebook 
ON public.facebook_connections(facebook_id, is_active) 
WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.facebook_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own Facebook connections"
  ON public.facebook_connections FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own Facebook connections"
  ON public.facebook_connections FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own Facebook connections"
  ON public.facebook_connections FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own Facebook connections"
  ON public.facebook_connections FOR DELETE
  USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_facebook_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_facebook_connections_updated_at ON public.facebook_connections;
CREATE TRIGGER trigger_update_facebook_connections_updated_at
  BEFORE UPDATE ON public.facebook_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_facebook_connections_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.facebook_connections;

-- Grant permissions
GRANT ALL ON public.facebook_connections TO authenticated;
GRANT ALL ON public.facebook_connections TO service_role;