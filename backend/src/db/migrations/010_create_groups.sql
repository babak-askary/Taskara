CREATE TABLE groups (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  slug        VARCHAR(80) UNIQUE NOT NULL,
  description TEXT,
  owner_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Slug is the searchable handle (e.g. "frontend-morning"). Indexed for
-- exact match (UNIQUE already creates one) plus prefix search via the trigram
-- pattern in the controller. A simple lower(slug) index supports that.
CREATE INDEX idx_groups_slug_lower ON groups(LOWER(slug));
CREATE INDEX idx_groups_owner_id   ON groups(owner_id);
