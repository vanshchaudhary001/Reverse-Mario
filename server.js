// server.js - Princess Saves Mario: The Reverse Rescue Backend
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { seedDatabase } = require('./db/seed');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db', 'game.db');

// Ensure db directory exists
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize SQLite database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Run schema and seed automatically on startup
seedDatabase(db);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets (no-cache for instant live development updates)
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
}));

// ---------------- REST API ROUTES ----------------

// POST /api/player - Register or retrieve existing player
app.post('/api/player', (req, res) => {
  try {
    let { username } = req.body;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username must be a valid non-empty string' });
    }
    username = username.trim().slice(0, 24);
    if (username.length < 2) {
      return res.status(400).json({ error: 'Username must be at least 2 characters long' });
    }

    // Check if player exists
    let player = db.prepare('SELECT id, username, created_at FROM players WHERE username = ?').get(username);
    if (!player) {
      const info = db.prepare('INSERT INTO players (username) VALUES (?)').run(username);
      player = { id: info.lastInsertRowid, username, created_at: new Date().toISOString() };
    }

    return res.status(200).json(player);
  } catch (err) {
    console.error('Error in POST /api/player:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/run - Save completed or ongoing game run
app.post('/api/run', (req, res) => {
  try {
    const { player_id, username, score, level_reached, lives_used, duration } = req.body;

    const parsedScore = parseInt(score, 10);
    const parsedLevel = parseInt(level_reached, 10);
    const parsedLives = parseInt(lives_used, 10);
    const parsedDuration = parseInt(duration, 10);

    if (isNaN(parsedScore) || parsedScore < 0) {
      return res.status(400).json({ error: 'Score must be a non-negative integer' });
    }
    if (isNaN(parsedLevel) || parsedLevel < 1 || parsedLevel > 4) {
      return res.status(400).json({ error: 'Level reached must be between 1 and 4' });
    }
    if (isNaN(parsedLives) || parsedLives < 0) {
      return res.status(400).json({ error: 'Lives used must be a non-negative integer' });
    }
    if (isNaN(parsedDuration) || parsedDuration < 0) {
      return res.status(400).json({ error: 'Duration must be non-negative' });
    }

    let actualPlayerId = player_id;
    if (!actualPlayerId && username) {
      const cleanUsername = String(username).trim().slice(0, 24);
      let p = db.prepare('SELECT id FROM players WHERE username = ?').get(cleanUsername);
      if (!p) {
        const info = db.prepare('INSERT INTO players (username) VALUES (?)').run(cleanUsername);
        actualPlayerId = info.lastInsertRowid;
      } else {
        actualPlayerId = p.id;
      }
    }

    const stmt = db.prepare(`
      INSERT INTO runs (player_id, score, level_reached, lives_used, duration, synced_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const result = stmt.run(actualPlayerId || null, parsedScore, parsedLevel, parsedLives, parsedDuration);

    return res.status(201).json({
      success: true,
      runId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Error in POST /api/run:', err);
    return res.status(500).json({ error: 'Internal server error saving run' });
  }
});

// GET /api/leaderboard - Top 15 player high scores with level reached
app.get('/api/leaderboard', (req, res) => {
  try {
    const stmt = db.prepare(`
      WITH RankedRuns AS (
        SELECT 
          r.id, 
          COALESCE(p.username, 'Anonymous Mechanic') AS username,
          r.score, 
          r.level_reached, 
          r.lives_used, 
          r.duration, 
          r.created_at,
          ROW_NUMBER() OVER (
            PARTITION BY COALESCE(p.username, r.player_id) 
            ORDER BY r.score DESC, r.level_reached DESC, r.duration ASC
          ) as rn
        FROM runs r
        LEFT JOIN players p ON r.player_id = p.id
      )
      SELECT 
        id, 
        username, 
        score, 
        level_reached, 
        lives_used, 
        duration, 
        created_at
      FROM RankedRuns
      WHERE rn = 1
      ORDER BY score DESC, level_reached DESC, duration ASC
      LIMIT 15
    `);
    const leaderboard = stmt.all();
    return res.status(200).json(leaderboard);
  } catch (err) {
    console.error('Error in GET /api/leaderboard:', err);
    return res.status(500).json({ error: 'Internal server error loading leaderboard' });
  }
});

// GET /api/trivia - Get questions by difficulty without revealing correct answers!
app.get('/api/trivia', (req, res) => {
  try {
    const { difficulty } = req.query;
    let query = 'SELECT id, difficulty, category, question, options FROM trivia';
    const params = [];

    if (difficulty && ['easy', 'medium', 'hard', 'extreme'].includes(difficulty.toLowerCase())) {
      query += ' WHERE LOWER(difficulty) = ?';
      params.push(difficulty.toLowerCase());
    }

    query += ' ORDER BY RANDOM()';

    const rows = db.prepare(query).all(...params);
    const sanitizedRows = rows.map(r => ({
      id: r.id,
      difficulty: r.difficulty,
      category: r.category,
      question: r.question,
      options: typeof r.options === 'string' ? JSON.parse(r.options) : r.options
    }));

    return res.status(200).json(sanitizedRows);
  } catch (err) {
    console.error('Error in GET /api/trivia:', err);
    return res.status(500).json({ error: 'Internal server error fetching trivia' });
  }
});

// POST /api/trivia/verify - Server-side trivia answer verification
app.post('/api/trivia/verify', (req, res) => {
  try {
    const { questionId, chosenAnswer } = req.body;
    if (!questionId || chosenAnswer === undefined) {
      return res.status(400).json({ error: 'Missing questionId or chosenAnswer' });
    }

    const q = db.prepare('SELECT id, question, correct_answer, category FROM trivia WHERE id = ?').get(questionId);
    if (!q) {
      return res.status(404).json({ error: 'Trivia question not found' });
    }

    const cleanChoice = String(chosenAnswer).replace(/^[A-D]\)\s*/i, '').trim().toLowerCase();
    const cleanCorrect = String(q.correct_answer).replace(/^[A-D]\)\s*/i, '').trim().toLowerCase();
    const isCorrect = (cleanChoice === cleanCorrect) || 
                      (String(chosenAnswer).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase());

    return res.status(200).json({
      correct: isCorrect,
      questionId: q.id,
      correctAnswer: q.correct_answer
    });
  } catch (err) {
    console.error('Error in POST /api/trivia/verify:', err);
    return res.status(500).json({ error: 'Internal server error verifying trivia' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    game: 'Princess Saves Mario: The Reverse Rescue',
    timestamp: new Date().toISOString()
  });
});

// Fallback to index.html for single page app
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('Princess Saves Mario: Engine initializing...');
  }
});

// Start listening if executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`👑 Princess Saves Mario: The Reverse Rescue is RUNNING!`);
    console.log(`🎮 Game URL: http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

module.exports = { app, db };

