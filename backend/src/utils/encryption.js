/**
 * Encryption Utility for Chat Messages
 * Uses AES-256-GCM for secure message encryption
 */

const crypto = require('crypto');

class EncryptionService {
  constructor() {
    // Use environment variable for encryption key in production
    this.secretKey = process.env.CHAT_ENCRYPTION_KEY || 'nanojobs-chat-secret-key-32-chars!!';
    this.algorithm = 'aes-256-gcm';
    this.keyBuffer = crypto.scryptSync(this.secretKey, 'salt', 32);
  }

  /**
   * Encrypt a message
   * @param {string} text - Plain text message to encrypt
   * @returns {string} - Encrypted message with IV and auth tag
   */
  encrypt(text) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipherGCM(this.algorithm, this.keyBuffer, iv);
      cipher.setAAD(Buffer.from('nanojobs-chat', 'utf8'));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Combine IV, auth tag, and encrypted data
      const result = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
      return result;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt a message
   * @param {string} encryptedData - Encrypted message with IV and auth tag
   * @returns {string} - Decrypted plain text message
   */
  decrypt(encryptedData) {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipherGCM(this.algorithm, this.keyBuffer, iv);
      decipher.setAAD(Buffer.from('nanojobs-chat', 'utf8'));
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  /**
   * Generate a secure random chat room ID
   * @returns {string} - Random chat room identifier
   */
  generateChatId() {
    return crypto.randomBytes(16).toString('hex');
  }
}

module.exports = new EncryptionService();