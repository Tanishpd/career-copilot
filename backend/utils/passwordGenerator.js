import crypto from 'crypto';

/**
 * Generate a secure random password
 * @param {number} length - Length of the password (default: 12)
 * @returns {string} - Generated password
 */
export const generateSecurePassword = (length = 12) => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';

    const allChars = uppercase + lowercase + numbers + symbols;

    let password = '';

    // Ensure at least one character from each category
    password += uppercase[crypto.randomInt(0, uppercase.length)];
    password += lowercase[crypto.randomInt(0, lowercase.length)];
    password += numbers[crypto.randomInt(0, numbers.length)];
    password += symbols[crypto.randomInt(0, symbols.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += allChars[crypto.randomInt(0, allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => crypto.randomInt(-1, 2)).join('');
};

/**
 * Generate a random token for password reset
 * @returns {string} - Random token
 */
export const generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
};
