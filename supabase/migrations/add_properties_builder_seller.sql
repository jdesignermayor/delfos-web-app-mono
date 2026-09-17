-- "Quién construye" / "Quién vende" fields on the property form (Micro step,
-- below Gerencia) — separate from the existing developer_id ("Constructora"
-- in Macro), both referencing the same developers table.
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS builder_id INTEGER REFERENCES developers(id),
  ADD COLUMN IF NOT EXISTS seller_id INTEGER REFERENCES developers(id);
