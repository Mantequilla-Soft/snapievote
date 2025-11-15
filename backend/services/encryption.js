const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-cbc';
    this.keyLength = 32; // 256 bits
  }

  // Derive encryption key from master password
  deriveKey(masterPassword, salt = 'snapievote-hive-automation') {
    return crypto.scryptSync(masterPassword, salt, this.keyLength);
  }

  // Encrypt posting key
  encrypt(text, masterPassword) {
    const key = this.deriveKey(masterPassword);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex')
    };
  }

  // Decrypt posting key
  decrypt(encryptedData, iv, masterPassword) {
    const key = this.deriveKey(masterPassword);
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      key,
      Buffer.from(iv, 'hex')
    );
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Validate posting key format (basic check)
  isValidPostingKey(key) {
    return key && key.length > 0 && key.startsWith('5');
  }
}

module.exports = EncryptionService;
