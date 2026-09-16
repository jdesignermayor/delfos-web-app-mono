-- Create constructoras table
CREATE TABLE IF NOT EXISTS constructoras (
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

-- Create inmobiliarias table
CREATE TABLE IF NOT EXISTS inmobiliarias (
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

-- Create fiducias table
CREATE TABLE IF NOT EXISTS fiducias (
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

-- Create bancos table
CREATE TABLE IF NOT EXISTS bancos (
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

-- Create zonas_comunes table
CREATE TABLE IF NOT EXISTS zonas_comunes (
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
CREATE INDEX idx_constructoras_name ON constructoras(name);
CREATE INDEX idx_constructoras_created_at ON constructoras(created_at);

CREATE INDEX idx_inmobiliarias_name ON inmobiliarias(name);
CREATE INDEX idx_inmobiliarias_created_at ON inmobiliarias(created_at);

CREATE INDEX idx_fiducias_name ON fiducias(name);
CREATE INDEX idx_fiducias_created_at ON fiducias(created_at);

CREATE INDEX idx_bancos_name ON bancos(name);
CREATE INDEX idx_bancos_created_at ON bancos(created_at);

CREATE INDEX idx_zonas_comunes_name ON zonas_comunes(name);
CREATE INDEX idx_zonas_comunes_created_at ON zonas_comunes(created_at);

-- Enable RLS (Row Level Security) if needed
ALTER TABLE constructoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE inmobiliarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiducias ENABLE ROW LEVEL SECURITY;
ALTER TABLE bancos ENABLE ROW LEVEL SECURITY;
ALTER TABLE zonas_comunes ENABLE ROW LEVEL SECURITY;

-- Create policies to allow superadmin to manage these tables
CREATE POLICY "Allow superadmin full access to constructoras" ON constructoras
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow superadmin full access to inmobiliarias" ON inmobiliarias
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow superadmin full access to fiducias" ON fiducias
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow superadmin full access to bancos" ON bancos
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow superadmin full access to zonas_comunes" ON zonas_comunes
  USING (true)
  WITH CHECK (true);
