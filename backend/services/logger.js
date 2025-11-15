class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 200; // Keep last 200 logs in memory
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };

    this.logs.push(logEntry);
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Also console log with color
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      vote: '🗳️',
      detect: '📝',
      block: '🔗'
    }[level] || 'ℹ️';

    console.log(`${emoji} ${message}`, data ? data : '');
  }

  info(message, data) {
    this.log('info', message, data);
  }

  success(message, data) {
    this.log('success', message, data);
  }

  warning(message, data) {
    this.log('warning', message, data);
  }

  error(message, data) {
    this.log('error', message, data);
  }

  vote(message, data) {
    this.log('vote', message, data);
  }

  detect(message, data) {
    this.log('detect', message, data);
  }

  block(message, data) {
    this.log('block', message, data);
  }

  getLogs(limit = 50) {
    return this.logs.slice(-limit).reverse();
  }

  clear() {
    this.logs = [];
  }
}

// Singleton instance
const logger = new Logger();

module.exports = logger;
