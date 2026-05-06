import crypto from 'crypto';

const GLOBAL_SECRET = process.env.ENCRYPTION_SECRET || 'aeris-default-secret-change-this';

// Derive a unique key per user using their MongoDB _id
const deriveKey = (userId) => {
    return crypto.scryptSync(`${GLOBAL_SECRET}:${userId}`, 'aeris-salt', 32);
};

export const encrypt = (text, userId) => {
    if (!text) return text;
    try {
        const key = deriveKey(userId.toString());
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        const encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    } catch {
        return text;
    }
};

export const decrypt = (encryptedText, userId) => {
    if (!encryptedText) return encryptedText;
    // If not encrypted (old entries), return as is
    if (!encryptedText.includes(':')) return encryptedText;
    try {
        const key = deriveKey(userId.toString());
        const [ivHex, encrypted] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
    } catch {
        return encryptedText; // return as is if decryption fails
    }
};

export const encryptMessages = (messages, userId) => {
    if (!messages?.length) return messages;
    return messages.map(m => ({
        ...m,
        content: encrypt(m.content, userId)
    }));
};

export const decryptMessages = (messages, userId) => {
    if (!messages?.length) return messages;
    return messages.map(m => ({
        ...m,
        content: decrypt(m.content, userId)
    }));
};