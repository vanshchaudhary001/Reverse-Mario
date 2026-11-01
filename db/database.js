// db/database.js - Native SQLite wrapper using Node.js built-in node:sqlite
const { DatabaseSync } = require('node:sqlite');

class DatabaseWrapper {
  constructor(filePath) {
    this._db = new DatabaseSync(filePath);
  }

  pragma(pragmaStr) {
    return this._db.exec(`PRAGMA ${pragmaStr}`);
  }

  exec(sql) {
    return this._db.exec(sql);
  }

  prepare(sql) {
    return this._db.prepare(sql);
  }

  transaction(fn) {
    return (...args) => {
      this._db.exec('BEGIN');
      try {
        const result = fn(...args);
        this._db.exec('COMMIT');
        return result;
      } catch (err) {
        this._db.exec('ROLLBACK');
        throw err;
      }
    };
  }

  close() {
    return this._db.close();
  }
}

module.exports = DatabaseWrapper;

