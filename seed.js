// db/seed.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'game.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const TRIVIA_DATA = [
  // ==========================================
  // LEVEL 1 – EASY (Stage 1)
  // ==========================================
  {
    difficulty: 'easy',
    category: 'Internet Culture & Memes',
    question: 'What is this viral spinning animal meme called? 🦝',
    options: ['Pedro Raccoon', 'Dancing Dog', 'Banana Cat', 'Vibing Penguin'],
    correct_answer: 'Pedro Raccoon'
  },
  {
    difficulty: 'easy',
    category: 'Internet Slang',
    question: 'What does "sus" mean in internet slang? 🕵️',
    options: ['Successful', 'Suspicious', 'Super cool', 'Surprised'],
    correct_answer: 'Suspicious'
  },
  {
    difficulty: 'easy',
    category: 'Internet Culture & Memes',
    question: 'What is this famous meme format called? 👩💬 😾',
    options: ['Angry Cat', 'Woman Yelling at a Cat', 'Confused Dog', 'Cat Argument'],
    correct_answer: 'Woman Yelling at a Cat'
  },
  {
    difficulty: 'easy',
    category: 'Emojis & Symbols',
    question: 'What does this emoji represent? 🚀',
    options: ['Aeroplane', 'Rocket', 'Helicopter', 'Train'],
    correct_answer: 'Rocket'
  },
  {
    difficulty: 'easy',
    category: 'Reactions & Memes',
    question: 'What reaction does this face represent? 😒',
    options: ['Happiness', 'Side-eye and disbelief', 'Confusion about maths', 'Excitement'],
    correct_answer: 'Side-eye and disbelief'
  },
  {
    difficulty: 'easy',
    category: 'Movies & Memes',
    question: 'Which movie does this famous champagne-toast meme come from? 🥂🍾',
    options: ['Titanic', 'The Great Gatsby', 'Inception', 'The Wolf of Wall Street'],
    correct_answer: 'The Great Gatsby'
  },
  {
    difficulty: 'easy',
    category: 'Internet Culture & Memes',
    question: 'What is this famous surprised animal meme called? 🐿️😲',
    options: ['Dramatic Chipmunk', 'Angry Hamster', 'Shocked Squirrel', 'Talking Dog'],
    correct_answer: 'Dramatic Chipmunk'
  },
  {
    difficulty: 'easy',
    category: 'Emojis & Symbols',
    question: 'What do you get when you combine these emojis? 🌧️ + ☂️',
    options: ['Sunny day', 'Rainy day', 'Snowfall', 'Windy day'],
    correct_answer: 'Rainy day'
  },
  {
    difficulty: 'easy',
    category: 'Emojis & Symbols',
    question: 'What is this symbol commonly used for? ❤️',
    options: ['Love', 'Anger', 'Sleep', 'Hunger'],
    correct_answer: 'Love'
  },
  {
    difficulty: 'easy',
    category: 'Emojis & Symbols',
    question: 'What do you call this? 🛒',
    options: ['Shopping cart', 'Suitcase', 'Wheelchair', 'Bicycle'],
    correct_answer: 'Shopping cart'
  },

  // ==========================================
  // LEVEL 2 – MODERATE (Stage 2)
  // ==========================================
  {
    difficulty: 'medium',
    category: 'Digital & Computer Symbols',
    question: 'What does this symbol 🔄 usually mean?',
    options: ['Delete', 'Refresh or reload', 'Download', 'Print'],
    correct_answer: 'Refresh or reload'
  },
  {
    difficulty: 'medium',
    category: 'Digital & Computer Symbols',
    question: 'What does this symbol 🗑️ represent on a computer?',
    options: ['Recycle Bin or Trash', 'Downloads', 'Settings', 'Documents'],
    correct_answer: 'Recycle Bin or Trash'
  },
  {
    difficulty: 'medium',
    category: 'Computer Shortcuts',
    question: 'What does Ctrl + Z do on most computers?',
    options: ['Save', 'Undo', 'Copy', 'Paste'],
    correct_answer: 'Undo'
  },
  {
    difficulty: 'medium',
    category: 'Digital & Computer Symbols',
    question: 'What does the symbol ⬇️ generally mean when seen beside a file?',
    options: ['Upload', 'Download', 'Delete', 'Rename'],
    correct_answer: 'Download'
  },
  {
    difficulty: 'medium',
    category: 'Computer Shortcuts',
    question: 'What does Ctrl + S commonly do?',
    options: ['Search', 'Save', 'Select all', 'Shut down'],
    correct_answer: 'Save'
  },

  // ==========================================
  // LEVEL 3 & 4 – HARD (Stage 3 & Stage 4)
  // ==========================================
  {
    difficulty: 'hard',
    category: 'Mental Math',
    question: 'What is 55 + 26?',
    options: ['71', '81', '91', '79'],
    correct_answer: '81'
  },
  {
    difficulty: 'hard',
    category: 'Mental Math',
    question: 'What is 200 − 86?',
    options: ['104', '114', '124', '134'],
    correct_answer: '114'
  },
  {
    difficulty: 'hard',
    category: 'Mental Math',
    question: 'What is the result of 150 minus 75?',
    options: ['50', '65', '75', '85'],
    correct_answer: '75'
  },
  {
    difficulty: 'hard',
    category: 'Mental Math',
    question: 'What is 8 multiplied by 7?',
    options: ['54', '56', '62', '64'],
    correct_answer: '56'
  },
  {
    difficulty: 'hard',
    category: 'E-Commerce & Symbols',
    question: 'Look at this symbol: 🛒 (a wire basket on wheels). What does this icon represent on an e-commerce website?',
    options: ['Wishlist', 'Checkout', 'Shopping Cart', 'Customer Service'],
    correct_answer: 'Shopping Cart'
  },
  {
    difficulty: 'hard',
    category: 'Logos & Brands',
    question: 'This logo, featuring four overlapping rings 🔘🔘🔘🔘, represents which luxury automotive brand?',
    options: ['Mercedes-Benz', 'BMW', 'Lexus', 'Audi'],
    correct_answer: 'Audi'
  },
  {
    difficulty: 'hard',
    category: 'Universal Symbols',
    question: 'Look at this symbol: ♻️ (three arrows forming a continuous triangle). What is this universally known as?',
    options: ['The Biohazard Symbol', 'The Recycling Symbol', 'The Infinite Loop Symbol', 'The Energy Star Logo'],
    correct_answer: 'The Recycling Symbol'
  },
  {
    difficulty: 'hard',
    category: 'IEEE WIE & Engineering',
    question: 'Based on the IEEE WIE logo (⚡👩‍🔬 IEEE WIE), what is the correct full form of "WIE"?',
    options: ['Women in Electronics', 'Worldwide Institute of Engineers', 'Women in Engineering', 'World of Intelligent Enterprise'],
    correct_answer: 'Women in Engineering'
  },

  // Extreme (identical to Hard for Stage 4 compatibility)
  {
    difficulty: 'extreme',
    category: 'Mental Math',
    question: 'What is 55 + 26?',
    options: ['71', '81', '91', '79'],
    correct_answer: '81'
  },
  {
    difficulty: 'extreme',
    category: 'Mental Math',
    question: 'What is 200 − 86?',
    options: ['104', '114', '124', '134'],
    correct_answer: '114'
  },
  {
    difficulty: 'extreme',
    category: 'Mental Math',
    question: 'What is the result of 150 minus 75?',
    options: ['50', '65', '75', '85'],
    correct_answer: '75'
  },
  {
    difficulty: 'extreme',
    category: 'Mental Math',
    question: 'What is 8 multiplied by 7?',
    options: ['54', '56', '62', '64'],
    correct_answer: '56'
  },
  {
    difficulty: 'extreme',
    category: 'E-Commerce & Symbols',
    question: 'Look at this symbol: 🛒 (a wire basket on wheels). What does this icon represent on an e-commerce website?',
    options: ['Wishlist', 'Checkout', 'Shopping Cart', 'Customer Service'],
    correct_answer: 'Shopping Cart'
  },
  {
    difficulty: 'extreme',
    category: 'Logos & Brands',
    question: 'This logo, featuring four overlapping rings 🔘🔘🔘🔘, represents which luxury automotive brand?',
    options: ['Mercedes-Benz', 'BMW', 'Lexus', 'Audi'],
    correct_answer: 'Audi'
  },
  {
    difficulty: 'extreme',
    category: 'Universal Symbols',
    question: 'Look at this symbol: ♻️ (three arrows forming a continuous triangle). What is this universally known as?',
    options: ['The Biohazard Symbol', 'The Recycling Symbol', 'The Infinite Loop Symbol', 'The Energy Star Logo'],
    correct_answer: 'The Recycling Symbol'
  },
  {
    difficulty: 'extreme',
    category: 'IEEE WIE & Engineering',
    question: 'Based on the IEEE WIE logo (⚡👩‍🔬 IEEE WIE), what is the correct full form of "WIE"?',
    options: ['Women in Electronics', 'Worldwide Institute of Engineers', 'Women in Engineering', 'World of Intelligent Enterprise'],
    correct_answer: 'Women in Engineering'
  }
];

function seedDatabase(dbInstance, force = true) {
  const db = dbInstance || new Database(DB_PATH);
  
  // Ensure schema exists
  if (fs.existsSync(SCHEMA_PATH)) {
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schemaSql);
  }

  // If force or old questions exist, replace table
  if (force) {
    db.prepare('DELETE FROM trivia').run();
  } else {
    const countRow = db.prepare('SELECT COUNT(*) as count FROM trivia').get();
    if (countRow.count > 0) {
      console.log(`[Seed] Database already has ${countRow.count} trivia questions.`);
      return;
    }
  }

  console.log('[Seed] Seeding updated trivia questions...');
  const insertStmt = db.prepare(`
    INSERT INTO trivia (difficulty, category, question, options, correct_answer)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((questions) => {
    for (const q of questions) {
      insertStmt.run(q.difficulty, q.category, q.question, JSON.stringify(q.options), q.correct_answer);
    }
  });

  insertMany(TRIVIA_DATA);
  console.log(`[Seed] Successfully seeded ${TRIVIA_DATA.length} trivia questions across Easy (Level 1), Medium (Level 2), and Hard (Levels 3 & 4)!`);

  // Ensure default guest player exists
  const existingPlayer = db.prepare('SELECT id FROM players WHERE username = ?').get('PeachChampion');
  if (!existingPlayer) {
    db.prepare('INSERT INTO players (username) VALUES (?)').run('PeachChampion');
  }

  // Ensure Hall of Rescuers has at least top 15 champions seeded
  const DEFAULT_CHAMPIONS = [
    { username: 'PeachOperative', score: 25650, level_reached: 4, duration: 296 },
    { username: 'PrincessCommander', score: 22400, level_reached: 4, duration: 270 },
    { username: 'CyberMarioSavior', score: 19850, level_reached: 4, duration: 310 },
    { username: 'MagmaVanquisher', score: 17200, level_reached: 4, duration: 335 },
    { username: 'NeonYoshiKnight', score: 14500, level_reached: 3, duration: 240 },
    { username: 'CrownMechanic', score: 12800, level_reached: 3, duration: 215 },
    { username: 'AeroPeachAce', score: 11100, level_reached: 3, duration: 190 },
    { username: 'StarRescueRanger', score: 9600, level_reached: 3, duration: 185 },
    { username: 'RunicGuardian', score: 8200, level_reached: 2, duration: 160 },
    { username: 'ForestStalker', score: 6900, level_reached: 2, duration: 145 },
    { username: 'PeachEngineer', score: 4500, level_reached: 3, duration: 180 },
    { username: 'SkyRealmStriker', score: 3800, level_reached: 2, duration: 120 },
    { username: 'HeroinePeachEngineer', score: 2000, level_reached: 4, duration: 9 },
    { username: 'HeroinePeach', score: 1550, level_reached: 4, duration: 9 },
    { username: 'krishna', score: 1050, level_reached: 1, duration: 22 }
  ];

  for (const c of DEFAULT_CHAMPIONS) {
    let p = db.prepare('SELECT id FROM players WHERE username = ?').get(c.username);
    if (!p) {
      const info = db.prepare('INSERT INTO players (username) VALUES (?)').run(c.username);
      p = { id: info.lastInsertRowid };
    }
    const run = db.prepare('SELECT id FROM runs WHERE player_id = ?').get(p.id);
    if (!run) {
      db.prepare('INSERT INTO runs (player_id, score, level_reached, lives_used, duration) VALUES (?, ?, ?, ?, ?)').run(
        p.id, c.score, c.level_reached, 0, c.duration
      );
    }
  }
}

// If run directly
if (require.main === module) {
  seedDatabase(null, true);
  console.log('[Seed] Seeding completed successfully.');
}

module.exports = { seedDatabase, TRIVIA_DATA };
