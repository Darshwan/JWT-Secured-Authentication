import 'dotenv/config'
import { configDotenv } from 'dotenv'
import express from 'express'
import { connectDB } from './config/database.js'
import User from './models/userModel.js'
import jwt from 'jsonwebtoken'
import Token from './models/tokenSchema.js'
import crypto from 'crypto';
import sendVerificationEmail from './services/emailService.js'

connectDB()
const app = express()
configDotenv()

app.get('/', (req, res) => {
  res.send('route path /')
})

app.use(express.json());

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`)
})

function generateToken(userId) {
  return jwt.sign({ id: userId}, process.env.JWT_SECRET, { expiresIn: '1h' })
}

// Authentication Middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if(!token) return res.status(401).json({error: 'Access token required'})

  try {
    const blackListedToken = await Token.findOne({token})
    if(blackListedToken) {
      return res.status(403).json({error: 'Token is no longer available'})
    }
    // Token Verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password -verificationToken')
    if(!user) {
      return res.status(401).json({error: 'User belonging to this token no longer exists'})
    }
    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Token expired' });
    }
    res.status(500).json({ error: 'Internal server error during authentication' });
  }    
}

// USER REGISTRATION ENDPOINT
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (!existingUser.isVerified) {
        // Regenerate verification token
        const newVerificationToken = crypto.randomBytes(32).toString('hex');
        existingUser.password = await bcrypt.hash(password, 10);
        existingUser.verificationToken = newVerificationToken;
        await existingUser.save();

        await sendVerificationEmail(existingUser.email, newVerificationToken);

        return res.status(200).json({
          message: 'A new verification email has been sent.',
          userId: existingUser._id,
        });
      }
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // ✅ Create new user
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = new User({
      email,
      password,
      verificationToken,
    });

    await newUser.save();

    await sendVerificationEmail(newUser.email, verificationToken);

    res.status(201).json({
      message: 'User created successfully. Please verify your account via email.',
      userId: newUser._id,
    });

  } catch (error) {
    console.error('Registration error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(el => el.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    console.error('Error during user registration:', error)
    res.status(500).json({ error: 'Internal server error' });
  }
})

//  USER LOGIN ENDPOINT
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Please verify your email address before logging in.' });
    }

    const token = generateToken(user._id);

    user.verificationToken = undefined;
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// EMAIL VERIFICATION ENDPOINT
app.get('/api/verify', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const verifiedUser = await User.findOne({ verificationToken: token });
    verifiedUser.isVerified = true;
    verifiedUser.verificationToken = undefined;
    await verifiedUser.save();
    Token.findOneAndDelete({ token })

    if (!verifiedUser) {
      return res.status(400).json({ error: 'Token is invalid or has expired' });
    }
    console.log('User verified:', verifiedUser._doc);
    res.send('<h1>Email successfully verified! You can now log in.</h1>');
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// LOGOUT ENDPOINT
app.post('/api/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    await Token.create({ token });

    res.status(200).json({
      status: 'success',
      message: 'Successfully logged out'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});