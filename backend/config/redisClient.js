const { createClient } = require('redis');

let redisClient = null;
let isRedisConnected = false;

async function connectRedis() {
    if (isRedisConnected) {
        console.log('Redis client already connected.');
        return;
    }

    if (!redisClient) {
        redisClient = createClient({
            url: process.env.REDIS_URL,
            reconnectStrategy: false
        });

        redisClient.on('error', (err) => {
            isRedisConnected = false;
        });

        redisClient.on('connect', () => {
            console.log('Connected to Redis!');
            isRedisConnected = true;
        });

        redisClient.on('end', () => {
            console.warn('Redis Client connection ended.');
            isRedisConnected = false;
        });
    }

    try {
        if (!redisClient.isReady) {
            console.log('Attempting initial connection to Redis...');
            await redisClient.connect();
            console.log('Redis client connected successfully!');
        } else {
            console.log('Redis client is already ready.');
            isRedisConnected = true;
        }
    } catch (error) {
        console.error('[ERROR] Initial connection to Redis failed:', error.message);
        isRedisConnected = false;
    }
}

const getIsRedisConnected = () => isRedisConnected;

module.exports = {
    redisClient,
    connectRedis,
    getIsRedisConnected
};