-- The developers table pre-dated create_entities_tables.sql (it was already
-- used by projects/properties), so `CREATE TABLE IF NOT EXISTS developers` in
-- that migration was a no-op and never added the nit/email/description
-- columns the "constructoras" entity form needs.
--
-- phone/address stay NOT NULL, unlike the other entity tables — the
-- constructoras form marks them as required to match.
ALTER TABLE developers
  ADD COLUMN IF NOT EXISTS nit TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;
