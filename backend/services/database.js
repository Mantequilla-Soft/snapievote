const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

class DatabaseService {
  constructor() {
    const dbPath = path.join(__dirname, '../data/snapievote.db');
    this.db = new Database(dbPath);
    this.initTables();
  }

  initTables() {
    // Master password (hashed with bcrypt)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS master_password (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Voting accounts with encrypted posting keys
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        encrypted_key TEXT NOT NULL,
        iv TEXT NOT NULL,
        min_vp_threshold INTEGER DEFAULT 70,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Good List (upvote targets)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS good_list (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        vote_weight INTEGER DEFAULT 50,
        delay_minutes INTEGER DEFAULT 5,
        max_votes_per_day INTEGER DEFAULT 10,
        include_comments INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Shit List (downvote targets)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS shit_list (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        vote_weight INTEGER DEFAULT 100,
        delay_minutes INTEGER DEFAULT 5,
        max_votes_per_day INTEGER DEFAULT 50,
        include_comments INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Vote history
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS vote_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        voter_account TEXT NOT NULL,
        target_author TEXT NOT NULL,
        target_permlink TEXT NOT NULL,
        vote_weight INTEGER NOT NULL,
        list_type TEXT NOT NULL,
        success INTEGER DEFAULT 1,
        error TEXT,
        voted_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Daily vote counter
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS daily_vote_count (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        target_username TEXT NOT NULL,
        list_type TEXT NOT NULL,
        vote_date DATE NOT NULL,
        vote_count INTEGER DEFAULT 0,
        UNIQUE(target_username, list_type, vote_date)
      )
    `);

    // Bot status
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bot_status (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        is_running INTEGER DEFAULT 0,
        last_block INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default bot status if not exists
    const statusExists = this.db.prepare('SELECT id FROM bot_status WHERE id = 1').get();
    if (!statusExists) {
      this.db.prepare('INSERT INTO bot_status (id, is_running) VALUES (1, 0)').run();
    }
  }

  // Master password methods
  setMasterPassword(hashedPassword) {
    const exists = this.db.prepare('SELECT id FROM master_password WHERE id = 1').get();
    if (exists) {
      this.db.prepare('UPDATE master_password SET password_hash = ? WHERE id = 1').run(hashedPassword);
    } else {
      this.db.prepare('INSERT INTO master_password (id, password_hash) VALUES (1, ?)').run(hashedPassword);
    }
  }

  getMasterPasswordHash() {
    const result = this.db.prepare('SELECT password_hash FROM master_password WHERE id = 1').get();
    return result ? result.password_hash : null;
  }

  // Account methods
  addAccount(username, encryptedKey, iv, minVpThreshold = 70) {
    return this.db.prepare(
      'INSERT INTO accounts (username, encrypted_key, iv, min_vp_threshold) VALUES (?, ?, ?, ?)'
    ).run(username, encryptedKey, iv, minVpThreshold);
  }

  getAccounts() {
    return this.db.prepare('SELECT id, username, min_vp_threshold, active FROM accounts').all();
  }

  getAccountWithKey(username) {
    return this.db.prepare('SELECT * FROM accounts WHERE username = ?').get(username);
  }

  updateAccount(id, data) {
    const { min_vp_threshold, active } = data;
    return this.db.prepare(
      'UPDATE accounts SET min_vp_threshold = ?, active = ? WHERE id = ?'
    ).run(min_vp_threshold, active, id);
  }

  deleteAccount(id) {
    return this.db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
  }

  // Good List methods
  addToGoodList(data) {
    const { username, vote_weight = 50, delay_minutes = 5, max_votes_per_day = 10, include_comments = 0 } = data;
    return this.db.prepare(
      'INSERT INTO good_list (username, vote_weight, delay_minutes, max_votes_per_day, include_comments) VALUES (?, ?, ?, ?, ?)'
    ).run(username, vote_weight, delay_minutes, max_votes_per_day, include_comments);
  }

  getGoodList() {
    return this.db.prepare('SELECT * FROM good_list ORDER BY active DESC, username ASC').all();
  }

  updateGoodListItem(id, data) {
    const { vote_weight, delay_minutes, max_votes_per_day, include_comments, active } = data;
    return this.db.prepare(
      'UPDATE good_list SET vote_weight = ?, delay_minutes = ?, max_votes_per_day = ?, include_comments = ?, active = ? WHERE id = ?'
    ).run(vote_weight, delay_minutes, max_votes_per_day, include_comments, active, id);
  }

  deleteGoodListItem(id) {
    return this.db.prepare('DELETE FROM good_list WHERE id = ?').run(id);
  }

  // Shit List methods
  addToShitList(data) {
    const { username, vote_weight = 100, delay_minutes = 5, max_votes_per_day = 50, include_comments = 0 } = data;
    return this.db.prepare(
      'INSERT INTO shit_list (username, vote_weight, delay_minutes, max_votes_per_day, include_comments) VALUES (?, ?, ?, ?, ?)'
    ).run(username, vote_weight, delay_minutes, max_votes_per_day, include_comments);
  }

  getShitList() {
    return this.db.prepare('SELECT * FROM shit_list ORDER BY active DESC, username ASC').all();
  }

  updateShitListItem(id, data) {
    const { vote_weight, delay_minutes, max_votes_per_day, include_comments, active } = data;
    return this.db.prepare(
      'UPDATE shit_list SET vote_weight = ?, delay_minutes = ?, max_votes_per_day = ?, include_comments = ?, active = ? WHERE id = ?'
    ).run(vote_weight, delay_minutes, max_votes_per_day, include_comments, active, id);
  }

  deleteShitListItem(id) {
    return this.db.prepare('DELETE FROM shit_list WHERE id = ?').run(id);
  }

  // Vote history methods
  addVoteHistory(voterAccount, targetAuthor, targetPermlink, voteWeight, listType, success = true, error = null) {
    return this.db.prepare(
      'INSERT INTO vote_history (voter_account, target_author, target_permlink, vote_weight, list_type, success, error) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(voterAccount, targetAuthor, targetPermlink, voteWeight, listType, success ? 1 : 0, error);
  }

  getRecentVoteHistory(limit = 20) {
    return this.db.prepare(
      'SELECT * FROM vote_history ORDER BY voted_at DESC LIMIT ?'
    ).all(limit);
  }

  // Daily vote counter methods
  getDailyVoteCount(targetUsername, listType) {
    const today = new Date().toISOString().split('T')[0];
    const result = this.db.prepare(
      'SELECT vote_count FROM daily_vote_count WHERE target_username = ? AND list_type = ? AND vote_date = ?'
    ).get(targetUsername, listType, today);
    return result ? result.vote_count : 0;
  }

  incrementDailyVoteCount(targetUsername, listType) {
    const today = new Date().toISOString().split('T')[0];
    const exists = this.db.prepare(
      'SELECT id FROM daily_vote_count WHERE target_username = ? AND list_type = ? AND vote_date = ?'
    ).get(targetUsername, listType, today);

    if (exists) {
      this.db.prepare(
        'UPDATE daily_vote_count SET vote_count = vote_count + 1 WHERE target_username = ? AND list_type = ? AND vote_date = ?'
      ).run(targetUsername, listType, today);
    } else {
      this.db.prepare(
        'INSERT INTO daily_vote_count (target_username, list_type, vote_date, vote_count) VALUES (?, ?, ?, 1)'
      ).run(targetUsername, listType, today);
    }
  }

  // Bot status methods
  getBotStatus() {
    return this.db.prepare('SELECT * FROM bot_status WHERE id = 1').get();
  }

  updateBotStatus(isRunning, lastBlock = null) {
    if (lastBlock !== null) {
      this.db.prepare(
        'UPDATE bot_status SET is_running = ?, last_block = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1'
      ).run(isRunning, lastBlock);
    } else {
      this.db.prepare(
        'UPDATE bot_status SET is_running = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1'
      ).run(isRunning);
    }
  }

  close() {
    this.db.close();
  }
}

module.exports = DatabaseService;
