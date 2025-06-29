const request = require('supertest');
const app = require('../server');
const db = require('../data/db');

beforeEach(() => {
    db.resetData();
});

describe('Authentication Flow', () => {
    // User signup successfully
    test('should register a new user successfully and return 201', async () => {
        const res = await request(app)
            .post('/api/auth/sign-up')
            .send({
                email: 'testuser@example.com',
                password: 'password123',
                phoneNumber: '0501112233',
                fullName: 'Test User'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'User have signed up');
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('id');

        const user = db.findUserByEmail('testuser@example.com');
        expect(user).toBeDefined();
        expect(user.isPhoneVerified).toBe(false);
        expect(user.otp).toBeDefined();
    });

    // User signup with existing email
    test('should return 409 if email already exists', async () => {
        await request(app)
            .post('/api/auth/sign-up')
            .send({
                email: 'existing@example.com',
                password: 'password123',
                phoneNumber: '0501112233',
                fullName: 'Existing User'
            });

        const res = await request(app)
            .post('/api/auth/sign-up')
            .send({
                email: 'existing@example.com',
                password: 'anotherpassword',
                phoneNumber: '0504445566',
                fullName: 'Another User'
            });

        expect(res.statusCode).toEqual(409);
        expect(res.body).toHaveProperty('error', 'Email is taken');
    });

    test('should verify phone number successfully', async () => {
        const signupRes = await request(app)
            .post('/api/auth/sign-up')
            .send({
                email: 'verify@example.com',
                password: 'password123',
                phoneNumber: '0507778899',
                fullName: 'Verify User'
            });

        const userId = signupRes.body.id;
        const userInDb = db.findUserById(userId);
        const otpCode = userInDb.otp;

        const verifyRes = await request(app)
            .post('/api/auth/sign-up/validate')
            .send({
                userId: userId,
                code: parseInt(otpCode)
            });

        expect(verifyRes.statusCode).toEqual(200);
        expect(verifyRes.body).toHaveProperty('message', 'Correct code');

        const verifiedUser = db.findUserById(userId);
        expect(verifiedUser.isPhoneVerified).toBe(true);
        expect(verifiedUser.otp).toBeUndefined();
    });

    // Phone verification with incorrect code
    test('should return 401 for incorrect OTP code', async () => {
        const signupRes = await request(app)
            .post('/api/auth/sign-up')
            .send({
                email: 'incorrect_otp@example.com',
                password: 'password123',
                phoneNumber: '0501231234',
                fullName: 'Incorrect OTP User'
            });

        const userId = signupRes.body.id;

        const verifyRes = await request(app)
            .post('/api/auth/sign-up/validate')
            .send({
                userId: userId,
                code: 999999
            });

        expect(verifyRes.statusCode).toEqual(401);
        expect(verifyRes.body).toHaveProperty('error', 'Incorrect code');
    });

    // User login successfully
    test('should log in user successfully after verification', async () => {
        const signupRes = await request(app)
            .post('/api/auth/sign-up')
            .send({
                email: 'login@example.com',
                password: 'loginpass',
                phoneNumber: '0505554433',
                fullName: 'Login User'
            });
        const userId = signupRes.body.id;
        const userInDb = db.findUserById(userId);
        const otpCode = userInDb.otp;

        await request(app)
            .post('/api/auth/sign-up/validate')
            .send({ userId: userId, code: parseInt(otpCode) });

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'login@example.com',
                password: 'loginpass'
            });

        expect(loginRes.statusCode).toEqual(200);
        expect(loginRes.body).toHaveProperty('message', 'Login successful');
    });

    // Login with unverified phone
    test('should return 403 if phone number is not verified', async () => {
        await request(app)
            .post('/api/auth/sign-up')
            .send({
                email: 'unverified@example.com',
                password: 'unverifiedpass',
                phoneNumber: '0501239876',
                fullName: 'Unverified User'
            });

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'unverified@example.com',
                password: 'unverifiedpass'
            });

        expect(loginRes.statusCode).toEqual(403);
        expect(loginRes.body).toHaveProperty('error', 'Phone number not verified. Please complete verification.');
    });

    // Login with incorrect password
    test('should return 401 for incorrect password during login', async () => {
        const signupRes = await request(app)
            .post('/api/auth/sign-up')
            .send({
                email: 'wrongpass@example.com',
                password: 'correctpass',
                phoneNumber: '0501112222',
                fullName: 'Wrong Pass User'
            });
        const userId = signupRes.body.id;
        const userInDb = db.findUserById(userId);
        const otpCode = userInDb.otp;
        await request(app)
            .post('/api/auth/sign-up/validate')
            .send({ userId: userId, code: parseInt(otpCode) });

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'wrongpass@example.com',
                password: 'incorrectpass'
            });

        expect(loginRes.statusCode).toEqual(401);
        expect(loginRes.body).toHaveProperty('error', 'Incorrect email or password');
    });
});