import { createHash, randomBytes } from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET || randomBytes(32).toString('hex'); // Use a strong, persistent secret

const generateToken = (): string => {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(`${CSRF_SECRET}:${salt}`).digest('hex');
  return `${salt}:${hash}`;
};

const verifyToken = (token: string): boolean => {
  const parts = token.split(':');
  if (parts.length !== 2) return false;

  const [salt, hash] = parts;
  const expectedHash = createHash('sha256').update(`${CSRF_SECRET}:${salt}`).digest('hex');

  // Use constant-time comparison to prevent timing attacks
  let valid = true;
  if (hash.length !== expectedHash.length) {
    valid = false;
  }
  for (let i = 0; i < hash.length; ++i) {
    if (hash[i] !== expectedHash[i]) {
      valid = false;
    }
  }
  return valid;
};

export const csrf = {
  generate: generateToken,
  verify: verifyToken,
}; 