-- SQLite Schema for Princess Saves Mario: The Reverse Rescue

CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER,
  score INTEGER NOT NULL,
  level_reached INTEGER NOT NULL,
  lives_used INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS trivia (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  difficulty TEXT NOT NULL, -- 'easy', 'medium', 'hard', 'extreme'
  question TEXT NOT NULL,
  options TEXT NOT NULL, -- JSON string array of 4 choices
  correct_answer TEXT NOT NULL,
  category TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trivia_diff ON trivia(difficulty);
CREATE INDEX IF NOT EXISTS idx_runs_score ON runs(score DESC);

