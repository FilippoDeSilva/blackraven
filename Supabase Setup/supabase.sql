-- USERS
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  username text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  subscription_status text,
  notification_preferences jsonb
);

-- FILES
CREATE TABLE IF NOT EXISTS public.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL REFERENCES public.users(auth_user_id),
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  storage_path text NOT NULL,
  encrypted boolean DEFAULT true,
  deactivation_passphrase_hash text NOT NULL,
  scheduled_for timestamptz,
  status text DEFAULT 'scheduled',
  receiver_info jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  platforms text[] not null default array[]::text[]
);

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL REFERENCES public.users(auth_user_id),
  plan text NOT NULL,
  status text NOT NULL,
  start_date timestamptz,
  end_date timestamptz,
  payment_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- PLATFORMS (optional)
CREATE TABLE IF NOT EXISTS public.platforms (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE
);

-- FILE_PLATFORMS (optional)
CREATE TABLE IF NOT EXISTS public.file_platforms (
  id serial PRIMARY KEY,
  file_id uuid REFERENCES public.files(id),
  platform_id int REFERENCES public.platforms(id),
  receiver_account text
);