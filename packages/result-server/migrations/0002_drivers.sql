-- Driver name overrides: driver_id -> canonical display name
CREATE TABLE IF NOT EXISTS drivers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  driver_id   INTEGER NOT NULL UNIQUE,
  driver_name TEXT    NOT NULL
);
