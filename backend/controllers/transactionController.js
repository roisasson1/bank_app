const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// GET /api/balance
const getBalance = async (req, res) => {
    const authenticatedUserEmail = req.user.email;
    const authenticatedUserId = req.user.id;

    try {
        const user = await User.findById(authenticatedUserId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json({
            balance: user.accountBalance,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching balance' });
    }
};

// GET /api/transactions
const getTransactionsHistory = async (req, res) => {
    const authenticatedUserEmail = req.user.email;
    const authenticatedUserId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    try {
        const user = await User.findById(authenticatedUserId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // find transaction where user is sender/reciever
        const rawTransactions = await Transaction.find({
            $or: [{ sender: user._id }, { receiver: user._id }]
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('sender', 'email fullName')
            .populate('receiver', 'email fullName'); // put user details automatically

        const formattedTransactions = rawTransactions.map(t => {
            const isCurrentUserSender = t.sender._id.toString() === user._id.toString();
            const participant = isCurrentUserSender ? t.receiver : t.sender;

            return {
                amount: isCurrentUserSender ? -t.amount : t.amount,
                participant: participant ? `${participant.fullName} (${participant.email})` : 'Unknown User',
                date: t.createdAt.toLocaleDateString('en-US'),
                time: t.createdAt.toLocaleTimeString('en-US', { hour12: false }),
                description: t.description
            };
        });
        res.status(200).json(formattedTransactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching transactions history' });
    }
};

// POST /api/transactions/send
const sendMoney = async (req, res) => {
    const authenticatedUserEmail = req.user.email;
    const authenticatedUserId = req.user.id;
    const { "reciever-email": receiverEmail, amount } = req.body;

    if (!receiverEmail || amount === undefined || amount === null) {
        return res.status(400).json({ error: 'Receiver email and amount are required' });
    }

    if (amount <= 0 || typeof amount !== 'number' || isNaN(amount)) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    if (!receiverEmail.includes('@') || !receiverEmail.includes('.')) {
        return res.status(400).json({ error: 'Invalid receiver email' });
    }

    let session;
    try {
        session = await mongoose.startSession();
        session.startTransaction();

        const sender = await User.findById(authenticatedUserId).session(session);
        const receiver = await User.findOne({ email: receiverEmail }).session(session);

        if (!sender) {
            await session.abortTransaction();
            return res.status(404).json({ error: 'Sender user not found' });
        }

        if (!receiver) {
            await session.abortTransaction();
            return res.status(404).json({ error: 'No user exists with this mail (receiver)' });
        }

        if (sender._id.toString() === receiver._id.toString()) {
            await session.abortTransaction();
            return res.status(400).json({ error: 'Cannot send money to yourself' });
        }

        if (sender.accountBalance < amount) {
            await session.abortTransaction();
            return res.status(409).json({ error: 'Insufficient amount for transaction' });
        }

        // update balances
        sender.accountBalance = parseFloat((sender.accountBalance - amount).toFixed(2));
        receiver.accountBalance = parseFloat((receiver.accountBalance + amount).toFixed(2));

        // save updated users
        await sender.save({ session });
        await receiver.save({ session });

        const transaction = new Transaction({
            sender: sender._id,
            receiver: receiver._id,
            amount: amount,
            description: `Transaction from ${sender.fullName} to ${receiver.fullName}`
        });

        await transaction.save({ session });
        await session.commitTransaction();

        console.log(`Transaction successful: ${amount} from ${sender.email} to ${receiver.email}`);
        sendTransactionNotifications(req, sender.email, receiver.email, amount, sender.fullName, receiver.fullName);
        res.status(200).json({
            message: 'Transaction completed successfully',
            updatedBalance: sender.accountBalance.toFixed(2),
        });

    } catch (error) {
        if (session) await session.abortTransaction();
        console.error(error);
        res.status(500).json({ error: 'Server error during transaction' });
    } finally {
        if (session) session.endSession();
    }
};

const sendTransactionNotifications = async (req, senderEmail, receiverEmail, amount, senderFullName, receiverFullName) => {
    try {
        // get socket.io instance and connected users
        const io = req.app.get('getSocketIo')();
        const usersConnected = await req.app.get('getUsersConnected')();

        console.log('Users connected:', usersConnected);
        console.log('Sender email:', senderEmail, 'Receiver email:', receiverEmail);

        if (!usersConnected) {
            console.error('usersConnected is undefined or null');
            return;
        }

        if (!io || typeof io.to !== 'function') {
            console.error('Invalid Socket.IO instance:', io);
            return;
        }

        const senderSocketId = usersConnected[senderEmail];
        const receiverSocketId = usersConnected[receiverEmail];
        console.log('Sender socket ID:', senderSocketId, 'Receiver socket ID:', receiverSocketId);

        const notificationDataForSender = {
            amount: amount,
            participant: receiverFullName,
            type: 'outcome',
            message: `You sent ${amount.toFixed(2)}$ to ${receiverFullName}!`
        };

        const notificationDataForReceiver = {
            amount: amount,
            participant: senderFullName,
            type: 'income',
            message: `You received ${amount.toFixed(2)}$ from ${senderFullName}!`
        };

        // send notification to sender
        if (senderSocketId) {
            io.to(senderSocketId).emit('transaction:new', notificationDataForSender);
            console.log(`Notification sent to sender (${senderEmail}) about transaction.`);
        }

        // send notification to receiver if connected
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('transaction:new', notificationDataForReceiver);
            console.log(`Notification sent to receiver (${receiverEmail}) about transaction.`);
        }

    } catch (error) {
        console.error('Error sending Socket.IO notifications:', error.message);
    }
};

module.exports = {
    sendMoney,
    getBalance,
    getTransactionsHistory,
};