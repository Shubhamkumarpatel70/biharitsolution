const crypto = require('crypto');

const base32Encode = buffer => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0, value = 0, output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { output += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits) output += alphabet[(value << (5 - bits)) & 31];
  return output;
};
const base32Decode = value => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0, buffer = 0; const bytes = [];
  for (const char of String(value || '').replace(/=+$/,'').toUpperCase()) {
    const idx = alphabet.indexOf(char); if (idx < 0) continue;
    buffer = (buffer << 5) | idx; bits += 5;
    if (bits >= 8) { bytes.push((buffer >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(bytes);
};
const makeTotpSecret = () => base32Encode(crypto.randomBytes(20));
const totp = (secret, time = Date.now()) => {
  const counter = Math.floor(time / 30000);
  const data = Buffer.alloc(8); data.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac('sha1', base32Decode(secret)).update(data).digest();
  const offset = digest[digest.length - 1] & 15;
  const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 1000000;
  return String(code).padStart(6, '0');
};
const verifyTotp = (secret, code) => {
  const submitted = String(code || '').replace(/\s/g,'');
  if (!/^\d{6}$/.test(submitted)) return false;
  const now = Date.now();
  return [-1,0,1].some(step => crypto.timingSafeEqual(Buffer.from(totp(secret, now + step * 30000)), Buffer.from(submitted)));
};
const encryptionKey = () => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET must be configured before using authenticator 2FA.');
  return crypto.createHash('sha256').update(String(process.env.JWT_SECRET)).digest();
};
const encryptSecret = plain => {
  const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return [iv.toString('hex'), cipher.getAuthTag().toString('hex'), encrypted.toString('hex')].join(':');
};
const decryptSecret = value => {
  const [iv, tag, encrypted] = String(value || '').split(':');
  if (!iv || !tag || !encrypted) throw new Error('Invalid encrypted 2FA secret.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv,'hex'));
  decipher.setAuthTag(Buffer.from(tag,'hex'));
  return Buffer.concat([decipher.update(Buffer.from(encrypted,'hex')), decipher.final()]).toString('utf8');
};
module.exports = { makeTotpSecret, verifyTotp, encryptSecret, decryptSecret };
