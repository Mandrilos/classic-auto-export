# Supabase Setup Guide

## 1. Database — Run this SQL in the Supabase SQL Editor

Go to: **Supabase Dashboard → SQL Editor → New Query**

```sql
-- Create the cars table
CREATE TABLE cars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2030),
  price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  description TEXT DEFAULT '',
  destination_countries TEXT[] DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cars_updated_at
  BEFORE UPDATE ON cars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- Allow public read access (catalog is public)
CREATE POLICY "Public read access"
  ON cars FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow all operations for authenticated users
-- Since we use anon key for admin ops, we allow all via anon too.
-- For production, use service role key for admin writes instead.
CREATE POLICY "Allow all for anon"
  ON cars FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
```

## 2. Storage — Create the car-photos bucket

### Option A: Via Dashboard
1. Go to **Supabase Dashboard → Storage**
2. Click **New bucket**
3. Name: `car-photos`
4. Enable **Public bucket** toggle
5. Click **Create bucket**

### Option B: Via SQL
```sql
-- Run in SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('car-photos', 'car-photos', true);
```

### Storage Policies
Run in SQL Editor:
```sql
-- Allow public read
CREATE POLICY "Public read car photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'car-photos');

-- Allow anon uploads (for admin panel using anon key)
CREATE POLICY "Allow anon upload car photos"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'car-photos');

-- Allow anon delete
CREATE POLICY "Allow anon delete car photos"
  ON storage.objects FOR DELETE
  TO anon
  USING (bucket_id = 'car-photos');
```

## 3. Environment Variables

Your `.env.local` is already configured. For production (Vercel, etc.) add:

```
NEXT_PUBLIC_SUPABASE_URL=https://imujlwfknuenjvpzygsf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_v5tsP-kYmJi6y69GsD0_YQ_UN2Agznk
ADMIN_PASSWORD=your-secure-password-here
```

> **Security note:** For production, set a strong ADMIN_PASSWORD.
> Consider replacing the anon-key admin writes with a service role key
> stored only server-side (never NEXT_PUBLIC_).

## 4. Quick Test

After setup, open the app and:
- Visit `/` — catalog should load (empty initially)
- Visit `/admin` — login with your ADMIN_PASSWORD
- Create a car listing with photos
- Check the catalog to see it appear
