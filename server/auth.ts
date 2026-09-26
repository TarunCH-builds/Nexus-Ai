/**
 * NEXUS AI - Cryptographically Secure Authentication & Session Module
 * 
 * Implements scrypt key-derivation for password hashing with random 16-byte salt,
 * time-safe comparison to prevent timing attacks, and secure 256-bit crypto sessions.
 * Never stores plaintext passwords.
 */

import crypto from 'crypto';

export interface UserSession {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export class AuthService {
  private static readonly SALT_LENGTH = 16;
  private static readonly KEY_LENGTH = 64;
  private static readonly SCRYPT_OPTIONS: crypto.ScryptOptions = {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 32 * 1024 * 1024,
  };

  /**
   * Validates standard email address formatting.
   */
  public static validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  /**
   * Validates password strength (min 6 chars).
   */
  public static validatePassword(password: string): { valid: boolean; message?: string } {
    if (!password || typeof password !== 'string') {
      return { valid: false, message: 'Password is required.' };
    }
    if (password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters long.' };
    }
    return { valid: true };
  }

  /**
   * Hashes a password using crypto.scryptSync with high computational cost.
   * Format: scrypt$<salt_hex>$<derived_key_hex>
   */
  public static hashPassword(password: string): string {
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    const salt = crypto.randomBytes(this.SALT_LENGTH).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, this.KEY_LENGTH, this.SCRYPT_OPTIONS);
    return `scrypt$${salt}$${derivedKey.toString('hex')}`;
  }

  /**
   * Verifies a password against the stored scrypt hash using timingSafeEqual.
   */
  public static verifyPassword(password: string, storedHash: string): boolean {
    if (!password || !storedHash) return false;
    const parts = storedHash.split('$');
    if (parts.length !== 3 || parts[0] !== 'scrypt') {
      return false;
    }
    const salt = parts[1];
    const originalHash = Buffer.from(parts[2], 'hex');
    const derivedKey = crypto.scryptSync(password, salt, this.KEY_LENGTH, this.SCRYPT_OPTIONS);
    
    if (originalHash.length !== derivedKey.length) {
      return false;
    }
    return crypto.timingSafeEqual(originalHash, derivedKey);
  }

  /**
   * Generates a 256-bit cryptographic hex token for session auth.
   */
  public static generateSessionToken(): string {
    return 'nxt_' + crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generates a unique user ID.
   */
  public static generateUserId(): string {
    return 'usr_' + crypto.randomBytes(12).toString('hex');
  }
}
