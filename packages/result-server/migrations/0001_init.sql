-- Create laptimes table
CREATE TABLE IF NOT EXISTS laptimes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  driver_id   INTEGER NOT NULL,
  driver_name TEXT    NOT NULL,
  session_id  INTEGER NOT NULL,
  competition TEXT    NOT NULL,
  lap_number  INTEGER NOT NULL,
  lap_time    REAL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(driver_id, session_id, lap_number, competition)
);

CREATE INDEX idx_laptimes_competition ON laptimes(competition);
CREATE INDEX idx_laptimes_driver ON laptimes(competition, driver_id);
