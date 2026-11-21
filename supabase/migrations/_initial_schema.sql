-- 1. Create Custom Enums (Statuses)
CREATE TYPE user_role AS ENUM ('client', 'contractor', 'admin');
CREATE TYPE contractor_status AS ENUM ('pending_verification', 'trial', 'active', 'expired', 'paused', 'rejected');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'closed');
CREATE TYPE doc_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. Base Profiles Table (Links to Supabase Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'client',
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Directory Tables
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE public.suburbs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL
);

-- 4. Contractor Core Table
CREATE TABLE public.contractors (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  business_name TEXT NOT NULL,
  bio TEXT,
  status contractor_status NOT NULL DEFAULT 'pending_verification',
  trial_ends_at TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT FALSE,
  yoco_customer_id TEXT, -- For recurring billing later
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Contractor Relationships (Many-to-Many)
CREATE TABLE public.contractor_categories (
  contractor_id UUID REFERENCES public.contractors(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (contractor_id, category_id)
);

CREATE TABLE public.contractor_suburbs (
  contractor_id UUID REFERENCES public.contractors(id) ON DELETE CASCADE,
  suburb_id UUID REFERENCES public.suburbs(id) ON DELETE CASCADE,
  PRIMARY KEY (contractor_id, suburb_id)
);

-- 6. Verification Documents
CREATE TABLE public.contractor_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES public.contractors(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- e.g., 'ID', 'Trade Certificate'
  file_url TEXT NOT NULL,
  status doc_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Client Requests & Lead Dispatch
CREATE TABLE public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Nullable for guest requests
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  category_id UUID REFERENCES public.categories(id),
  suburb_id UUID REFERENCES public.suburbs(id),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES public.contractors(id) ON DELETE CASCADE,
  status lead_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Subscriptions (Yoco Billing Tracking)
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES public.contractors(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL, -- 'standard', 'featured'
  status TEXT NOT NULL, -- 'active', 'past_due', 'canceled'
  yoco_subscription_token TEXT, -- Yoco uses tokens for recurring charges
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Triggers & Functions
-- Automatically create a profile when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update "updated_at" timestamps automatically
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_contractors_modtime BEFORE UPDATE ON public.contractors FOR EACH ROW EXECUTE PROCEDURE update_modified_column();