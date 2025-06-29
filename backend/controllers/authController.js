require('dotenv').config();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const twilio = require('twilio');
const { addToBlacklist } = require('../utils/blackTokenList');

// POST /api/auth/sign-up
const signup = async (req, res) => {
  const { email, password, phoneNumber, fullName } = req.body;

  if (!email || !password || !phoneNumber || !fullName) {
    return res.status(400).json({ error: 'All details are required' });
  }

  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (phoneNumber.length < 7 || phoneNumber.length > 15) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must have at least 4 digits' });
  }

  try {
    // check existing user by email
    let existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      if (!existingUserByEmail.isPhoneVerified) {
        console.log(`Deleting unverified user with email: ${email} (ID: ${existingUserByEmail._id})`);
        await User.deleteOne({ _id: existingUserByEmail._id });
      } else {
        return res.status(409).json({ error: 'Email is already taken and verified.' });
      }
    }

    // check existing user by phone number
    let existingUserByPhone = await User.findOne({ phoneNumber });
    if (existingUserByPhone) {
      if (!existingUserByPhone.isPhoneVerified) {
        console.log(`Deleting unverified user with phone number: ${phoneNumber} (ID: ${existingUserByPhone._id})`);
        await User.deleteOne({ _id: existingUserByPhone._id });
      } else {
        return res.status(409).json({ error: 'Phone number is already taken and verified.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otpCode = generateOtp();

    const newUser = new User({
      email,
      password: hashedPassword,
      phoneNumber,
      fullName,
      otp: otpCode,
      isPhoneVerified: false,
      accountBalance: 10000.00
    });
    await newUser.save();

    const smsResult = await sendOtpSms(phoneNumber, otpCode);
    if (!smsResult.success) {
      await User.deleteOne({ _id: newUser._id });
      return res.status(500).json({ error: smsResult.error || 'Failed to send verification code.' });
    }

    res.status(201).json({
      message: smsResult.message || 'User has signed up. Verification code sent to your phone.',
      id: newUser._id,
      email: newUser.email,
      fullName: newUser.fullName,
      isPhoneVerified: newUser.isPhoneVerified
    });

  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Invalid email or password' });
  }

  try {
    const user = await User.findOne({ email });
    const isMatch = await bcrypt.compare(password, user.password);

    if (!user || !isMatch) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    if (!user.isPhoneVerified) {
      return res.status(403).json({ error: 'Phone number not verified. Please complete verification.' });
    }

    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log(`Login successful: ${user.email} (ID: ${user._id})`);
    res.status(200).json({
      message: 'Login successful',
      email: user.email,
      fullName: user.fullName,
      accessToken
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// POST /api/auth/sign-up/validate
const verifyPhone = async (req, res) => {
  const { code, userId } = req.body;

  if (!userId || !code) {
    return res.status(400).json({ error: 'Missing user ID or OTP code' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (user.otp === undefined || user.otp.toString().trim() !== String(code).trim()) {
      return res.status(401).json({ error: 'Incorrect code' });
    }

    user.isPhoneVerified = true;
    user.otp = undefined;
    await user.save();

    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log(`Verification successful: ${user.email} (ID: ${user._id})`);
    res.status(200).json({
      message: 'Phone number verified successfully',
      email: user.email,
      fullName: user.fullName,
      accessToken
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during phone verification' });
  }
};


// DELETE /api/auth/logout
const logout = (req, res) => {
    const token = req.token;

    if (!token) {
        return res.status(400).json({ message: 'No token provided for logout.' });
    }

    try {
        const decodedToken = jwt.decode(token);
        const expiresInSeconds = decodedToken.exp - (Date.now() / 1000);

        if (expiresInSeconds > 0) {
            addToBlacklist(token, expiresInSeconds);
            console.log(`Token blacklisted for ${expiresInSeconds} seconds.`);
        }
        res.status(200).json({ message: 'Logged out successfully.' });

    } catch (error) {
        console.error('Error during logout token processing:', error);
        res.status(500).json({ message: 'Failed to process logout.' });
    }
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const useTwilio = process.env.USE_TWILIO === 'true';

const twilioClient = useTwilio
  ? new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const sendOtpSms = async (phoneNumber, otpCode) => {
  if (!useTwilio) {
    console.log(`Skipping Twilio SMS. OTP: ${otpCode} for phone: ${phoneNumber}`);
    return { success: true, message: 'SMS sending skipped in DEV mode.' };
  }

  try {
    const internationalPhoneNumber = phoneNumber.startsWith('+')
      ? phoneNumber
      : `+972${phoneNumber.substring(1)}`;

    console.log('Formatted phone number for Twilio:', internationalPhoneNumber);
    console.log('Verification code:', otpCode);

    await twilioClient.messages.create({
      body: `Your verification code is: ${otpCode}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: internationalPhoneNumber
    });

    console.log(`OTP sent successfully to ${internationalPhoneNumber}`);
    return { success: true, message: 'OTP sent successfully.' };
  } catch (twilioError) {
    console.error('Error sending OTP via Twilio:', twilioError.message);
    return { success: false, error: 'Failed to send verification code. Please try again.' };
  }
};

module.exports = {
  signup,
  login,
  verifyPhone,
  logout
};