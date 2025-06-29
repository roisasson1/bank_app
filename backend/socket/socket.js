const { Server } = require('socket.io');
const { redisClient, getIsRedisConnected } = require('../config/redisClient');

let io;
const localConnectedUsersCache = {};

const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.WEBSITE_DEV_URL,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected with socket ID: ${socket.id}`);

        socket.on('register', async (userEmail) => {
            if (userEmail) {
                if (getIsRedisConnected()) {
                    try {
                        await redisClient.set(`user_socket:${userEmail}`, socket.id);
                        console.log(`User ${userEmail} registered with socket ${socket.id} in Redis.`);
                    } catch (error) {
                        localConnectedUsersCache[userEmail] = socket.id;
                    }
                } else {
                    console.warn(`[WARN] Redis not connected. Storing user ${userEmail} socket ${socket.id} in local cache only.`);
                    localConnectedUsersCache[userEmail] = socket.id;
                }
                socket.emit('registered', { message: 'Socket registered successfully', userEmail: userEmail });
            }
        });

        socket.on('disconnect', async () => {
            console.log(`User disconnected with socket ID: ${socket.id}`);

            if (getIsRedisConnected()) {
                try {
                    const keys = await redisClient.keys('user_socket:*');
                    for (const key of keys) {
                        const storedSocketId = await redisClient.get(key);
                        if (storedSocketId === socket.id) {
                            await redisClient.del(key);
                            const userEmail = key.split(':')[1];
                            console.log(`User ${userEmail} unregistered from Redis.`);
                            break;
                        }
                    }
                } catch (error) {
                    console.warn(`[WARN] Error removing disconnected user from Redis.`);
                }
            } else {
                console.warn(`[WARN] Redis not connected. Skipping Redis cleanup for disconnected user.`);
            }

            for (const email in localConnectedUsersCache) {
                if (localConnectedUsersCache[email] === socket.id) {
                    delete localConnectedUsersCache[email];
                    console.log(`User ${email} unregistered from local cache.`);
                    break;
                }
            }
        });

        socket.on('error', (err) => {
            console.error('Socket error:', err.message);
        });
    });
};

const getIo = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized! Call initializeSocket first.');
    }
    return io;
};

const getUsersConnected = async () => {
    let userMap = {};
    if (getIsRedisConnected()) {
        try {
            const keys = await redisClient.keys('user_socket:*');
            for (const key of keys) {
                const userEmail = key.split(':')[1];
                const socketId = await redisClient.get(key);
                userMap[userEmail] = socketId;
            }
            return userMap;
        } catch (error) {
            return localConnectedUsersCache;
        }
    } else {
        console.warn('Redis not connected. Returning users from local cache only.');
        return localConnectedUsersCache;
    }
};

module.exports = {
    initializeSocket,
    getIo,
    getUsersConnected
};