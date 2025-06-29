const request = require('supertest');
const app = require('../server');
const db = require('../data/db');

describe('Transactions Flow', () => {
    let user1, user2, user3;

    beforeEach(async () => {
        db.resetData();

        // Sender
        await request(app)
            .post('/api/auth/sign-up')
            .send({
                email: 'sender@example.com',
                password: 'password123',
                phoneNumber: '0501112233',
                fullName: 'Sender User'
            });
        user1 = db.findUserByEmail('sender@example.com');
        user1.accountBalance = 1000;
        await request(app)
            .post('/api/auth/sign-up/validate')
            .send({ userId: user1.id, code: parseInt(user1.otp) });

        // Receiver
        await request(app)
            .post('/api/auth/sign-up')
            .send({
                email: 'receiver@example.com',
                password: 'password123',
                phoneNumber: '0504445566',
                fullName: 'Receiver User'
            });
        user2 = db.findUserByEmail('receiver@example.com');
        user2.accountBalance = 500;
        await request(app)
            .post('/api/auth/sign-up/validate')
            .send({ userId: user2.id, code: parseInt(user2.otp) });

        // User 3
        await request(app)
            .post('/api/auth/sign-up')
            .send({
                email: 'thirdparty@example.com',
                password: 'password123',
                phoneNumber: '0507778899',
                fullName: 'Third Party'
            });
        user3 = db.findUserByEmail('thirdparty@example.com');
        user3.accountBalance = 200;
        await request(app)
            .post('/api/auth/sign-up/validate')
            .send({ userId: user3.id, code: parseInt(user3.otp) });
    });


    /* POST /api/transactions/send */
    test('should send money successfully and update balances', async () => {
        const res = await request(app)
            .post('/api/transactions/send')
            .send({
                "sender-email": 'sender@example.com',
                "reciever-email": 'receiver@example.com',
                amount: 100
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Transaction completed successfully');
        expect(res.body).toHaveProperty('updatedBalance', '900.00');

        const updatedSender = db.findUserByEmail('sender@example.com');
        const updatedReceiver = db.findUserByEmail('receiver@example.com');

        expect(updatedSender.accountBalance).toEqual(900);
        expect(updatedReceiver.accountBalance).toEqual(600);

        const senderHistoryRes = await request(app)
            .get('/api/transactions')
            .query({ email: updatedSender.email });

        const receiverHistoryRes = await request(app)
            .get('/api/transactions')
            .query({ email: updatedReceiver.email });

        expect(senderHistoryRes.statusCode).toEqual(200);
        expect(receiverHistoryRes.statusCode).toEqual(200);

        const senderTransactions = senderHistoryRes.body;
        const receiverTransactions = receiverHistoryRes.body;

        expect(senderTransactions.length).toBe(1);
        expect(receiverTransactions.length).toBe(1);

        expect(senderTransactions[0].amount).toBe(-100);
        expect(senderTransactions[0].participant).toBe(user2.email);

        expect(receiverTransactions[0].amount).toBe(100);
        expect(receiverTransactions[0].participant).toBe(user1.email);
    });

    test('should return 400 if required fields are missing', async () => {
        const res = await request(app)
            .post('/api/transactions/send')
            .send({
                "sender-email": 'sender@example.com',
                amount: 50
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'All fields are required');
    });

    test('should return 400 for invalid amount (zero or negative)', async () => {
        const res1 = await request(app)
            .post('/api/transactions/send')
            .send({ "sender-email": 'sender@example.com', "reciever-email": 'receiver@example.com', amount: 0 });
        expect(res1.statusCode).toEqual(400);
        expect(res1.body).toHaveProperty('error', 'Amount must be a positive number');

        const res2 = await request(app)
            .post('/api/transactions/send')
            .send({ "sender-email": 'sender@example.com', "reciever-email": 'receiver@example.com', amount: -10 });
        expect(res2.statusCode).toEqual(400);
        expect(res2.body).toHaveProperty('error', 'Amount must be a positive number');
    });

    test('should return 400 for invalid amount (not a number)', async () => {
        const res = await request(app)
            .post('/api/transactions/send')
            .send({ "sender-email": 'sender@example.com', "reciever-email": 'receiver@example.com', amount: 'abc' });
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Amount must be a positive number');
    });

    test('should return 400 for invalid sender email format', async () => {
        const res = await request(app)
            .post('/api/transactions/send')
            .send({ "sender-email": 'invalid-email', "reciever-email": 'receiver@example.com', amount: 50 });
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Invalid sender email');
    });

    test('should return 400 for invalid receiver email format', async () => {
        const res = await request(app)
            .post('/api/transactions/send')
            .send({ "sender-email": 'sender@example.com', "reciever-email": 'invalid-email', amount: 50 });
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Invalid receiver email');
    });

    test('should return 404 if sender user does not exist', async () => {
        const res = await request(app)
            .post('/api/transactions/send')
            .send({
                "sender-email": 'nonexistent@example.com',
                "reciever-email": 'receiver@example.com',
                amount: 100
            });

        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('error', 'No user exists with this mail (sender)');
    });

    test('should return 404 if receiver user does not exist', async () => {
        const res = await request(app)
            .post('/api/transactions/send')
            .send({
                "sender-email": 'sender@example.com',
                "reciever-email": 'nonexistent@example.com',
                amount: 100
            });

        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('error', 'No user exists with this mail (receiver)');
    });

    test('should return 400 if sender tries to send money to themselves', async () => {
        const res = await request(app)
            .post('/api/transactions/send')
            .send({
                "sender-email": 'sender@example.com',
                "reciever-email": 'sender@example.com',
                amount: 50
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Cannot send money to yourself');
    });

    test('should return 409 for insufficient balance', async () => {
        const res = await request(app)
            .post('/api/transactions/send')
            .send({
                "sender-email": 'sender@example.com',
                "reciever-email": 'receiver@example.com',
                amount: 2000
            });

        expect(res.statusCode).toEqual(409);
        expect(res.body).toHaveProperty('error', 'Insufficient amount for transaction');
    });


    /* GET /api/balance */
    test('should return the correct balance for an existing user', async () => {
        const res = await request(app)
            .get('/api/balance')
            .query({ email: 'sender@example.com' });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('balance', 1000);
    });

    test('should return 400 if email parameter is missing', async () => {
        const res = await request(app)
            .get('/api/balance')
            .query({});

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Email parameter is required');
    });

    test('should return 404 if user not found for balance check', async () => {
        const res = await request(app)
            .get('/api/balance')
            .query({ email: 'nonexistent@example.com' });

        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('error', 'User not found');
    });


    /* GET /api/transactions */
    test('should return all transaction history for a user', async () => {
        await request(app)
            .post('/api/transactions/send')
            .send({
                "sender-email": 'sender@example.com',
                "reciever-email": 'receiver@example.com',
                amount: 50
            });

        // sender sends to thirdparty
        await request(app)
            .post('/api/transactions/send')
            .send({
                "sender-email": 'sender@example.com',
                "reciever-email": 'thirdparty@example.com',
                amount: 75
            });

        // Get sender's transaction history
        const res = await request(app)
            .get('/api/transactions')
            .query({ email: 'sender@example.com' });

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);

        // Check the first transaction (most recent)
        expect(res.body[0].amount).toEqual(-75);
        expect(res.body[0].participant).toEqual('thirdparty@example.com');
        expect(res.body[0]).toHaveProperty('date');
        expect(res.body[0]).toHaveProperty('time');

        // Check the second transaction
        expect(res.body[1].amount).toEqual(-50);
        expect(res.body[1].participant).toEqual('receiver@example.com');
    });

    test('should return transaction history for a receiver', async () => {
        await request(app)
            .post('/api/transactions/send')
            .send({
                "sender-email": 'sender@example.com',
                "reciever-email": 'receiver@example.com',
                amount: 50
            });

        const res = await request(app)
            .get('/api/transactions')
            .query({ email: 'receiver@example.com' });

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);

        expect(res.body[0].amount).toEqual(50);
        expect(res.body[0].participant).toEqual('sender@example.com');
    });


    test('should return limited transaction history when limit is provided', async () => {
        // multiple transactions
        await request(app).post('/api/transactions/send').send({ "sender-email": 'sender@example.com', "reciever-email": 'receiver@example.com', amount: 10 });
        await request(app).post('/api/transactions/send').send({ "sender-email": 'sender@example.com', "reciever-email": 'thirdparty@example.com', amount: 20 });
        await request(app).post('/api/transactions/send').send({ "sender-email": 'sender@example.com', "reciever-email": 'receiver@example.com', amount: 30 });

        const res = await request(app)
            .get('/api/transactions')
            .query({ email: 'sender@example.com', limit: 2 });

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);

        // Verify order
        expect(res.body[0].amount).toEqual(-30);
        expect(res.body[0].participant).toEqual('receiver@example.com');
        expect(res.body[1].amount).toEqual(-20);
        expect(res.body[1].participant).toEqual('thirdparty@example.com');
    });

    test('should return 400 if email parameter is missing for transaction history', async () => {
        const res = await request(app)
            .get('/api/transactions')
            .query({});

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Email parameter is required');
    });

    test('should return 404 if user not found for transaction history', async () => {
        const res = await request(app)
            .get('/api/transactions')
            .query({ email: 'nonexistent@example.com' });

        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('error', 'User not found');
    });

    test('should return an empty array if user has no transactions', async () => {
        // new user with no transactions
        await request(app)
            .post('/api/auth/sign-up')
            .send({
                email: 'notransactions@example.com',
                password: 'password123',
                phoneNumber: '0509998877',
                fullName: 'No Transactions User'
            });
        const noTransUser = db.findUserByEmail('notransactions@example.com');
        await request(app)
            .post('/api/auth/sign-up/validate')
            .send({ userId: noTransUser.id, code: parseInt(noTransUser.otp) });

        const res = await request(app)
            .get('/api/transactions')
            .query({ email: 'notransactions@example.com' });

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0);
    });
});