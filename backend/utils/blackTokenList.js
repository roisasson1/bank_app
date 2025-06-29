const { redisClient, getIsRedisConnected } = require('../config/redisClient');

const localBlacklist = new Set();

// stores token in redis with a prefix and expiration time
const addToBlacklist = async (token, expiresInSeconds) => {
    const integerExpiresInSeconds = Math.floor(expiresInSeconds);

    if (integerExpiresInSeconds <= 0) {
        return;
    }

    if (getIsRedisConnected()) {
        try {
            await redisClient.set(`blacklist:${token}`, 'blacklisted', { EX: integerExpiresInSeconds });
            console.log(`Token blacklisted in Redis for ${expiresInSeconds} seconds.`);
        } catch (error) {
            localBlacklist.add(token);
        }
    } else {
        console.warn('Redis not connected. Adding token to local blacklist cache only');
        localBlacklist.add(token);
    }
};

// checks if token exists in Redis
const isBlacklisted = async (token) => {
    if (getIsRedisConnected()) {
        try {
            const reply = await redisClient.get(`blacklist:${token}`);
            return reply === 'blacklisted';
        } catch (error) {
            return localBlacklist.has(token);
        }
    } else {
        return localBlacklist.has(token);
    }
};

module.exports = { addToBlacklist, isBlacklisted };