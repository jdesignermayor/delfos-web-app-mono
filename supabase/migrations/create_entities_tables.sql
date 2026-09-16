-- Create builders table (constructoras)
CREATE TABLE IF NOT EXISTS builders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  nit TEXT UNIQUE,
  phone TEXT,
  email TEXT,
  address TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create real_estate_agencies table (inmobiliarias)
CREATE TABLE IF NOT EXISTS real_estate_agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  nit TEXT UNIQUE,
  phone TEXT,
  email TEXT,
  address TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trust_companies table (fiducias)
CREATE TABLE IF NOT EXISTS trust_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  nit TEXT UNIQUE,
  phone TEXT,
  email TEXT,
  address TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create banks table
CREATE TABLE IF NOT EXISTS banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  nit TEXT UNIQUE,
  phone TEXT,
  email TEXT,
  address TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create common_areas table (zonas comunes)
CREATE TABLE IF NOT EXISTS common_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_builders_name ON builders(name);
CREATE INDEX idx_builders_created_at ON builders(created_at);

CREATE INDEX idx_real_estate_agencies_name ON real_estate_agencies(name);
CREATE INDEX idx_real_estate_agencies_created_at ON real_estate_agencies(created_at);

CREATE INDEX idx_trust_companies_name ON trust_companies(name);
CREATE INDEX idx_trust_companies_created_at ON trust_companies(created_at);

CREATE INDEX idx_banks_name ON banks(name);
CREATE INDEX idx_banks_created_at ON banks(created_at);

CREATE INDEX idx_common_areas_name ON common_areas(name);
CREATE INDEX idx_common_areas_created_at ON common_areas(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE builders ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_estate_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_areas ENABLE ROW LEVEL SECURITY;

-- Create policies to allow superadmin to manage these tables
CREATE POLICY "Allow superadmin full access to builders" ON builders
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow superadmin full access to real_estate_agencies" ON real_estate_agencies
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow superadmin full access to trust_companies" ON trust_companies
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow superadmin full access to banks" ON banks
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow superadmin full access to common_areas" ON common_areas
  USING (true)
  WITH CHECK (true);
