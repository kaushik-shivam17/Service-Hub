-- UrbanServe — Supabase Schema
-- Run this entire file in your Supabase SQL editor (Dashboard > SQL Editor > New query)

-- ─────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.categories (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  icon         TEXT NOT NULL,
  icon_library TEXT NOT NULL DEFAULT 'Feather',
  color        TEXT NOT NULL,
  bg_color     TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.services (
  id            TEXT PRIMARY KEY,
  category_id   TEXT REFERENCES public.categories(id),
  category_name TEXT NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  price         INTEGER NOT NULL,
  duration      INTEGER NOT NULL,
  rating        DECIMAL(3,1) DEFAULT 4.5,
  review_count  INTEGER DEFAULT 0,
  popular       BOOLEAN DEFAULT FALSE,
  includes      TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.providers (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  rating           DECIMAL(3,1) DEFAULT 4.5,
  review_count     INTEGER DEFAULT 0,
  experience_years INTEGER DEFAULT 1,
  specializations  TEXT[] DEFAULT '{}',
  price_per_hour   INTEGER NOT NULL,
  verified         BOOLEAN DEFAULT FALSE,
  completed_jobs   INTEGER DEFAULT 0,
  initials         TEXT NOT NULL,
  color            TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT,
  email      TEXT,
  phone      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id            TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id    TEXT REFERENCES public.services(id),
  service_name  TEXT NOT NULL,
  category_name TEXT NOT NULL,
  provider_id   TEXT REFERENCES public.providers(id),
  provider_name TEXT,
  date          TEXT NOT NULL,
  time          TEXT NOT NULL,
  address       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'upcoming'
                  CHECK (status IN ('upcoming','in_progress','completed','cancelled')),
  total_price   INTEGER NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id         TEXT PRIMARY KEY,
  booking_id TEXT REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES public.profiles(id),
  rating     INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews     ENABLE ROW LEVEL SECURITY;

-- Public read for catalog tables
CREATE POLICY "categories_public_read"  ON public.categories FOR SELECT USING (true);
CREATE POLICY "services_public_read"    ON public.services   FOR SELECT USING (true);
CREATE POLICY "providers_public_read"   ON public.providers  FOR SELECT USING (true);

-- Profiles — own row only
CREATE POLICY "profiles_own_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_own_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Bookings — own rows only
CREATE POLICY "bookings_own_select" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookings_own_insert" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookings_own_update" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);

-- Reviews — own rows only, public read
CREATE POLICY "reviews_public_read"  ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_own_insert"   ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- TRIGGER: auto-create profile on signup
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─────────────────────────────────────────────
-- SEED DATA
-- ─────────────────────────────────────────────

INSERT INTO public.categories (id, name, icon, icon_library, color, bg_color) VALUES
  ('cat_1','Cleaning',     'home',        'Feather','#1A56DB','#EFF6FF'),
  ('cat_2','AC Service',   'thermometer', 'Feather','#059669','#ECFDF5'),
  ('cat_3','Plumbing',     'droplet',     'Feather','#0EA5E9','#F0F9FF'),
  ('cat_4','Electrician',  'zap',         'Feather','#D97706','#FFFBEB'),
  ('cat_5','Appliances',   'tool',        'Feather','#7C3AED','#F5F3FF'),
  ('cat_6','Pest Control', 'shield',      'Feather','#DC2626','#FEF2F2'),
  ('cat_7','Painting',     'edit-2',      'Feather','#DB2777','#FDF2F8'),
  ('cat_8','Carpentry',    'layers',      'Feather','#92400E','#FFF7ED')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.services (id, category_id, category_name, name, description, price, duration, rating, review_count, popular, includes) VALUES
  ('svc_1','cat_1','Cleaning','Home Deep Cleaning','Complete deep cleaning of your home including kitchen, bathrooms, bedrooms and living areas. Eco-friendly products used.',899,240,4.8,2847,TRUE, ARRAY['Kitchen cleaning','Bathroom scrubbing','Floor mopping','Dusting & vacuuming','Sofa cleaning']),
  ('svc_2','cat_1','Cleaning','Bathroom Cleaning','Professional deep cleaning of all bathrooms with specialized products for tiles, fixtures and drains.',349,60,4.7,1923,FALSE,ARRAY['Tile scrubbing','Fixture polishing','Drain cleaning','Mirror cleaning','Floor mopping']),
  ('svc_3','cat_2','AC Service','AC Service & Cleaning','Complete servicing of split/window AC including filter cleaning, coil wash, gas check and performance optimization.',699,90,4.9,3421,TRUE, ARRAY['Filter cleaning','Coil wash','Gas pressure check','Performance test','Indoor unit cleaning']),
  ('svc_4','cat_2','AC Service','AC Installation','Professional installation of your new air conditioner with proper wiring, stand and gas filling.',1299,120,4.8,891,FALSE,ARRAY['Indoor unit mounting','Outdoor unit setup','Copper pipe fitting','Gas filling','Test run']),
  ('svc_5','cat_3','Plumbing','Pipe Leak Repair','Quick and effective repair of leaking pipes, joints, and fittings to prevent water damage.',299,60,4.6,1456,FALSE,ARRAY['Leak detection','Pipe repair/replace','Joint sealing','Water pressure check','Post-repair test']),
  ('svc_6','cat_3','Plumbing','Tap & Faucet Repair','Repair or replacement of leaking taps, mixers, and faucets in kitchen and bathrooms.',199,45,4.7,2108,FALSE,ARRAY['Tap inspection','Washer replacement','Faucet tightening','Leak sealing','Flow adjustment']),
  ('svc_7','cat_4','Electrician','Electrical Safety Check','Comprehensive inspection of all electrical connections, wiring, boards and fixtures for safety.',499,90,4.8,987,FALSE,ARRAY['Board inspection','Socket testing','Wiring check','MCB testing','Safety report']),
  ('svc_8','cat_4','Electrician','Fan Installation','Professional ceiling fan installation with proper wiring, capacitor setup and speed regulation.',249,45,4.9,3102,TRUE, ARRAY['Fan unboxing','Hook installation','Wiring setup','Capacitor fitting','Speed test']),
  ('svc_9','cat_5','Appliances','Washing Machine Repair','Expert diagnosis and repair of all washing machine issues including motor, drum, pump and electronic faults.',449,90,4.7,1234,FALSE,ARRAY['Fault diagnosis','Part replacement','Motor check','Water pump repair','Test cycle']),
  ('svc_10','cat_5','Appliances','Refrigerator Service','Complete refrigerator service including cooling check, gas refill, compressor inspection and thermostat calibration.',599,90,4.6,876,FALSE,ARRAY['Cooling check','Gas top-up','Compressor test','Thermostat calibration','Coil cleaning']),
  ('svc_11','cat_6','Pest Control','General Pest Control','Complete home pest control treatment for cockroaches, ants, spiders and other common pests.',799,120,4.5,1567,TRUE, ARRAY['Cockroach treatment','Ant control','Spider treatment','Safe chemicals','30-day warranty']),
  ('svc_12','cat_7','Painting','Interior Wall Painting','Professional interior painting service with premium paints, proper surface preparation and clean finish.',8999,480,4.8,654,FALSE,ARRAY['Surface prep','Primer coat','2 paint coats','Furniture cover','Clean-up'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.providers (id, name, rating, review_count, experience_years, specializations, price_per_hour, verified, completed_jobs, initials, color) VALUES
  ('pro_1','Rajesh Kumar', 4.9,892, 8,ARRAY['Cleaning','Pest Control'],     350,TRUE, 1247,'RK','#1A56DB'),
  ('pro_2','Suresh Sharma',4.8,643, 6,ARRAY['AC Service','Electrician'],    400,TRUE, 934, 'SS','#059669'),
  ('pro_3','Amit Singh',   4.9,1204,10,ARRAY['Plumbing','Appliances'],      380,TRUE, 1891,'AS','#7C3AED'),
  ('pro_4','Mohan Das',    4.7,421, 5,ARRAY['Painting','Carpentry'],        450,TRUE, 678, 'MD','#D97706'),
  ('pro_5','Vikram Patel', 4.8,763, 7,ARRAY['Electrician','AC Service'],    420,TRUE, 1102,'VP','#DC2626'),
  ('pro_6','Dinesh Yadav', 4.6,312, 4,ARRAY['Cleaning','Appliances'],       300,FALSE,489, 'DY','#0EA5E9')
ON CONFLICT (id) DO NOTHING;
