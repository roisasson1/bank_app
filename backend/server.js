const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const { authenticateToken } = require('./middlewares/authMiddleware');
const connectDB = require('./config/db');
const { redisClient, connectRedis } = require('./config/redisClient');

const http = require('http');
const { initializeSocket, getIo, getUsersConnected } = require('./socket/socket');

dotenv.config();
connectDB();
connectRedis();

const app = express();
app.use(express.json());
app.use(cors({
    origin: process.env.WEBSITE_DEV_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));

// socket server
const server = http.createServer(app);
initializeSocket(server);
app.set('getSocketIo', getIo);
app.set('getUsersConnected', getUsersConnected);

// api routes
app.use('/api/auth', authRoutes);
app.use('/api', authenticateToken, transactionRoutes);

app.get('/', (req, res) => {
  res.send('express server');
});

app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;