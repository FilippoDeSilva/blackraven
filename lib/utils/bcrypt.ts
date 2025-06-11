import bcrypt from 'bcryptjs'

// Hash password with 10 salt rounds
export async function hashPassword(password: string): Promise<string> {
  console.log("[hashPassword] Hashing passphrase...");
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt);
  console.log("[hashPassword] Passphrase hashed successfully.");
  return hashedPassword;
}

// Compare password with hash
export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  console.log("[comparePasswords] Comparing passphrases...");
  const result = await bcrypt.compare(password, hashedPassword);
  console.log("[comparePasswords] Comparison result:", result);
  return result;
}
