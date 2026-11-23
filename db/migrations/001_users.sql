CREATE TABLE users (
  id              TEXT PRIMARY KEY,
  display_name    TEXT        NOT NULL,
  city            TEXT        NOT NULL,
  city_normalized TEXT        NOT NULL,
  contact         TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX users_city_normalized_idx ON users (city_normalized);
