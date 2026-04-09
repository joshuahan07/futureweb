-- Add missing columns to wantlist for the gift/wantlist feature
ALTER TABLE wantlist ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE wantlist ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE wantlist ADD COLUMN IF NOT EXISTS claimed_by text CHECK (claimed_by IN ('joshua', 'sophie'));
ALTER TABLE wantlist ADD COLUMN IF NOT EXISTS price_low numeric;
ALTER TABLE wantlist ADD COLUMN IF NOT EXISTS price_high numeric;
